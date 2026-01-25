import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  hasCreditCard: boolean;
  creditLimit?: number;
  creditDueDay?: number;
  salaryAmount?: number;
  salaryDay?: number;
  advanceAmount?: number;
  advanceDay?: number;
  initialBalance?: number;
  currentCreditUsed?: number;
  affiliateCode?: number;
  couponCode?: string;
  adminAffiliateLinkCode?: string;
  pixKey?: string;
  pixKeyType?: string;
  paymentMethod: 'credit' | 'debit' | 'pix';
  renewalMatricula?: number;
  renewalDays?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    const MP_PUBLIC_KEY = Deno.env.get('MERCADO_PAGO_PUBLIC_KEY');
    
    if (!MP_ACCESS_TOKEN) {
      throw new Error('Mercado Pago Access Token not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: CheckoutRequest = await req.json();
    const { paymentMethod } = body;
    
    let fullName = body.fullName || '';
    let phone = body.phone || '';
    let cpf = body.cpf || '';
    let email = body.email || '';
    let isRenewal = false;
    
    // Check if renewal
    if (body.renewalMatricula) {
      isRenewal = true;
      const { data: existingUser, error: userError } = await supabase
        .from('users_matricula')
        .select('full_name, phone, cpf, email')
        .eq('matricula', body.renewalMatricula)
        .single();
      
      if (userError) {
        console.error('Error fetching user for renewal:', userError);
        return new Response(
          JSON.stringify({ error: 'Usuário não encontrado para renovação' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (existingUser) {
        fullName = existingUser.full_name || '';
        phone = existingUser.phone || '';
        cpf = existingUser.cpf || '';
        email = existingUser.email || '';
      }
    }
    
    // Validate
    if (!fullName || !phone) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: nome e telefone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!isRenewal && !cpf) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: nome, telefone e CPF' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate affiliate code
    let validAffiliateCode: number | null = null;
    if (body.affiliateCode) {
      const { data: affiliate } = await supabase
        .from('users_matricula')
        .select('matricula, user_status')
        .eq('matricula', body.affiliateCode)
        .eq('user_status', 'approved')
        .single();
      
      if (affiliate) {
        validAffiliateCode = affiliate.matricula;
      }
    }

    // Fetch prices
    const { data: priceSettings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['subscription_price', 'affiliate_price']);

    let defaultPrice = 49.99;
    let affiliatePrice = 29.99;

    priceSettings?.forEach((s: { key: string; value: string | null }) => {
      if (s.key === 'subscription_price' && s.value) defaultPrice = parseFloat(s.value);
      if (s.key === 'affiliate_price' && s.value) affiliatePrice = parseFloat(s.value);
    });

    // Apply coupon
    let couponDiscount = 0;
    let appliedCoupon: string | null = null;

    if (body.couponCode) {
      const { data: coupon } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', body.couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (coupon) {
        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
        const usageLimitReached = coupon.usage_limit && coupon.times_used >= coupon.usage_limit;

        if (!isExpired && !usageLimitReached) {
          appliedCoupon = coupon.code;
          const priceForDiscount = validAffiliateCode ? affiliatePrice : defaultPrice;

          if (coupon.discount_type === 'percentage') {
            couponDiscount = (priceForDiscount * coupon.discount_value) / 100;
          } else {
            couponDiscount = coupon.discount_value;
          }
          couponDiscount = Math.min(couponDiscount, priceForDiscount);

          await supabase
            .from('discount_coupons')
            .update({ times_used: coupon.times_used + 1 })
            .eq('id', coupon.id);
        }
      }
    }

    // Calculate amount
    let basePrice = validAffiliateCode ? affiliatePrice : defaultPrice;
    let amount = Math.max(1.00, basePrice - couponDiscount);
    
    if (isNaN(amount) || !isFinite(amount)) {
      amount = defaultPrice;
    }
    amount = Math.round(amount * 100) / 100;
    
    console.log('Payment amount calculated:', { paymentMethod, defaultPrice, affiliatePrice, basePrice, couponDiscount, finalAmount: amount });

    const userTempId = crypto.randomUUID();
    const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_temp_id: userTempId,
        full_name: fullName,
        email: email || null,
        phone: phone,
        cpf: cleanCpf || null,
        amount: amount,
        payment_status: 'pending',
        affiliate_code: validAffiliateCode,
        has_credit_card: body.hasCreditCard || false,
        credit_limit: body.creditLimit || 0,
        credit_due_day: body.creditDueDay || 5,
        salary_amount: body.salaryAmount || 0,
        salary_day: body.salaryDay || 5,
        advance_amount: body.advanceAmount || 0,
        advance_day: body.advanceDay || null,
        initial_balance: body.initialBalance || 0,
        current_credit_used: body.currentCreditUsed || 0,
        activate_affiliate_mode: false,
        admin_affiliate_link_code: body.adminAffiliateLinkCode || null,
        matricula: body.renewalMatricula || null,
        payment_provider: 'mercadopago',
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw new Error('Erro ao criar registro de pagamento');
    }

    // Get origin for callbacks
    const origin = req.headers.get('origin') || 'https://lovable.dev';
    
    const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    let payerEmail = (email || '').trim();
    if (!isValidEmail(payerEmail)) {
      const emailBase = cleanCpf || phone.replace(/\D/g, '');
      payerEmail = `${emailBase}@inovabank.com`;
    }

    // For PIX, create direct payment
    if (paymentMethod === 'pix') {
      const payerCpf = cleanCpf || '00000000000';

      const pixPaymentData = {
        transaction_amount: amount,
        description: validAffiliateCode 
          ? `Assinatura INOVABANK - Indicação #${validAffiliateCode}` 
          : 'Assinatura INOVABANK - Plano Premium',
        payment_method_id: 'pix',
        payer: {
          email: payerEmail,
          first_name: fullName.split(' ')[0],
          last_name: fullName.split(' ').slice(1).join(' ') || 'Cliente',
          identification: {
            type: 'CPF',
            number: payerCpf,
          },
        },
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
        external_reference: userTempId,
      };

      console.log('Creating PIX payment:', { userTempId, amount });

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': userTempId,
        },
        body: JSON.stringify(pixPaymentData),
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error('Mercado Pago PIX error:', JSON.stringify(mpData, null, 2));
        let errorMessage = 'Erro ao criar pagamento PIX';
        if (mpData.code === 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES') {
          errorMessage = 'Erro de autorização no Mercado Pago. Verifique as permissões da conta.';
        } else if (mpData.message) {
          errorMessage = mpData.message;
        }
        throw new Error(errorMessage);
      }

      console.log('PIX payment created:', mpData.id);

      await supabase
        .from('payments')
        .update({ mp_payment_id: String(mpData.id) })
        .eq('id', payment.id);

      const pixData = mpData.point_of_interaction?.transaction_data;

      return new Response(
        JSON.stringify({
          type: 'pix',
          paymentId: mpData.id,
          status: mpData.status,
          statusDetail: mpData.status_detail,
          amount: amount,
          userTempId: userTempId,
          isAffiliate: !!validAffiliateCode,
          pix: {
            qrCode: pixData?.qr_code || null,
            qrCodeBase64: pixData?.qr_code_base64 || null,
            ticketUrl: pixData?.ticket_url || null,
            expirationDate: mpData.date_of_expiration || null,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For credit/debit, create preference for Checkout Pro
    const excludedPaymentMethods: { id: string }[] = [];
    const excludedPaymentTypes: { id: string }[] = [];

    if (paymentMethod === 'credit') {
      excludedPaymentTypes.push({ id: 'debit_card' }, { id: 'ticket' }, { id: 'bank_transfer' });
    } else if (paymentMethod === 'debit') {
      excludedPaymentTypes.push({ id: 'credit_card' }, { id: 'ticket' }, { id: 'bank_transfer' });
    }

    const preferenceData = {
      items: [
        {
          id: userTempId,
          title: 'Assinatura INOVABANK',
          description: validAffiliateCode 
            ? `Assinatura INOVABANK - Indicação #${validAffiliateCode}` 
            : 'Assinatura INOVABANK - Plano Premium',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount,
        },
      ],
      payer: {
        name: fullName.split(' ')[0],
        surname: fullName.split(' ').slice(1).join(' ') || 'Cliente',
        email: payerEmail,
        phone: {
          number: phone.replace(/\D/g, ''),
        },
        identification: {
          type: 'CPF',
          number: cleanCpf || '00000000000',
        },
      },
      payment_methods: {
        excluded_payment_methods: excludedPaymentMethods,
        excluded_payment_types: excludedPaymentTypes,
        installments: paymentMethod === 'credit' ? 12 : 1,
      },
      back_urls: {
        success: `${origin}/payment-callback?status=success&temp_id=${userTempId}`,
        failure: `${origin}/payment-callback?status=failure&temp_id=${userTempId}`,
        pending: `${origin}/payment-callback?status=pending&temp_id=${userTempId}`,
      },
      auto_return: 'approved',
      external_reference: userTempId,
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      statement_descriptor: 'INOVABANK',
    };

    console.log('Creating MP preference for:', paymentMethod, { userTempId, amount });

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago preference error:', JSON.stringify(mpData, null, 2));
      throw new Error('Erro ao criar checkout no Mercado Pago');
    }

    console.log('MP preference created:', mpData.id);

    await supabase
      .from('payments')
      .update({ mp_preference_id: mpData.id })
      .eq('id', payment.id);

    return new Response(
      JSON.stringify({
        type: 'redirect',
        preferenceId: mpData.id,
        initPoint: mpData.init_point,
        sandboxInitPoint: mpData.sandbox_init_point,
        amount: amount,
        userTempId: userTempId,
        isAffiliate: !!validAffiliateCode,
        publicKey: MP_PUBLIC_KEY,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in create-checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
