'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Check,
  X,
  Edit,
  Plus,
  Monitor,
  Users,
  HardDrive,
  Zap,
  Crown,
  Star,
  Rocket,
} from 'lucide-react';
import PageHeader from './PageHeader';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: {
    screens: number | 'unlimited';
    storage: number; // GB
    users: number | 'unlimited';
    support: 'email' | 'priority' | '24/7';
    customBranding: boolean;
    apiAccess: boolean;
    analytics: 'basic' | 'advanced' | 'enterprise';
    campaigns: number | 'unlimited';
  };
  isPopular?: boolean;
  isEnterprise?: boolean;
}

const defaultPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal para pequenos negocios',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: {
      screens: 5,
      storage: 5,
      users: 2,
      support: 'email',
      customBranding: false,
      apiAccess: false,
      analytics: 'basic',
      campaigns: 3,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Para operadores de rede em crescimento',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    features: {
      screens: 25,
      storage: 25,
      users: 10,
      support: 'priority',
      customBranding: true,
      apiAccess: true,
      analytics: 'advanced',
      campaigns: 'unlimited',
    },
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes redes e customizacoes',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    features: {
      screens: 'unlimited',
      storage: 100,
      users: 'unlimited',
      support: '24/7',
      customBranding: true,
      apiAccess: true,
      analytics: 'enterprise',
      campaigns: 'unlimited',
    },
    isEnterprise: true,
  },
];

export default function SubscriptionPlansTab() {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getFeatureValue = (value: number | string | 'unlimited') => {
    if (value === 'unlimited') return 'Ilimitado';
    if (typeof value === 'number') return value.toString();
    return value;
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return Star;
      case 'professional': return Rocket;
      case 'enterprise': return Crown;
      default: return Star;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Planos de Assinatura"
        helpTitle="Planos de Assinatura"
        helpDescription="Configure planos de assinatura. Defina limites, precos e recursos de cada plano."
      />

      {/* Toggle Mensal/Anual */}
      <div className="flex items-center justify-center gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
          Mensal
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            billingCycle === 'yearly' ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              billingCycle === 'yearly' ? 'left-8' : 'left-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
          Anual
        </span>
        {billingCycle === 'yearly' && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Economize 17%
          </span>
        )}
      </div>

      {/* Cards de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const PlanIcon = getPlanIcon(plan.id);
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const pricePerMonth = billingCycle === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${
                plan.isPopular ? 'border-indigo-500' : 'border-gray-100'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-indigo-500 text-white text-center py-1 text-sm font-medium">
                  Mais Popular
                </div>
              )}

              <div className={`p-6 ${plan.isPopular ? 'pt-10' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan.isEnterprise ? 'bg-purple-100' :
                    plan.isPopular ? 'bg-indigo-100' : 'bg-gray-100'
                  }`}>
                    <PlanIcon className={`w-6 h-6 ${
                      plan.isEnterprise ? 'text-purple-600' :
                      plan.isPopular ? 'text-indigo-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatCurrency(pricePerMonth)}
                    </span>
                    <span className="text-gray-500">/mes</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(plan.yearlyPrice)} cobrado anualmente
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm text-gray-600">
                      {getFeatureValue(plan.features.screens)} telas
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm text-gray-600">
                      {plan.features.storage} GB de armazenamento
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm text-gray-600">
                      {getFeatureValue(plan.features.users)} usuarios
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm text-gray-600">
                      {getFeatureValue(plan.features.campaigns)} campanhas
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-2">
                    {plan.features.customBranding ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300" />
                    )}
                    <span className={`text-sm ${plan.features.customBranding ? 'text-gray-600' : 'text-gray-400'}`}>
                      White-label
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.features.apiAccess ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300" />
                    )}
                    <span className={`text-sm ${plan.features.apiAccess ? 'text-gray-600' : 'text-gray-400'}`}>
                      Acesso API
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">
                      Suporte {plan.features.support === '24/7' ? '24/7' :
                               plan.features.support === 'priority' ? 'prioritario' : 'por email'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">
                      Analytics {plan.features.analytics === 'enterprise' ? 'completo' :
                                 plan.features.analytics === 'advanced' ? 'avancado' : 'basico'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botao Adicionar Plano */}
      <div className="flex justify-center">
        <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
          <Plus className="w-5 h-5" />
          Criar Novo Plano
        </button>
      </div>

      {/* Informacoes Adicionais */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <h3 className="font-semibold text-gray-900 mb-2">Precisa de um plano customizado?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Para grandes redes com necessidades especificas, podemos criar um plano sob medida para sua operacao.
        </p>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Falar com Vendas
        </button>
      </div>
    </motion.div>
  );
}
