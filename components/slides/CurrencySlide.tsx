'use client';

import { useState, useEffect } from 'react';
import { MediaItem } from '@/types';

interface CurrencyData {
  code: string;
  name: string;
  buy: number;
  sell: number;
  variation: number;
}

interface CurrencySlideProps {
  item: MediaItem;
  onTimeUpdate?: (time: number) => void;
}

// Moedas padrão exibidas
const DEFAULT_CURRENCIES = ['USD', 'EUR', 'BTC'];

// Mapear códigos para nomes e ícones
const CURRENCY_INFO: Record<string, { name: string; icon: string }> = {
  USD: { name: 'Dólar Americano', icon: '$' },
  EUR: { name: 'Euro', icon: '€' },
  GBP: { name: 'Libra Esterlina', icon: '£' },
  BTC: { name: 'Bitcoin', icon: '₿' },
  ETH: { name: 'Ethereum', icon: 'Ξ' },
  JPY: { name: 'Yen Japonês', icon: '¥' },
  CNY: { name: 'Yuan Chinês', icon: '¥' },
  ARS: { name: 'Peso Argentino', icon: '$' },
};

export default function CurrencySlide({ item, onTimeUpdate }: CurrencySlideProps) {
  const [currencies, setCurrencies] = useState<CurrencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(item.durationSeconds || 20);

  // Extrair configurações
  let config = {
    title: 'Cotações do Dia',
    currencies: DEFAULT_CURRENCIES,
    bgColor: '#0f172a',
    textColor: '#ffffff',
    accentColor: '#F59E0B',
  };

  try {
    if (item.sourceUrl && item.sourceUrl.startsWith('{')) {
      config = { ...config, ...JSON.parse(item.sourceUrl) };
    }
  } catch (e) {
    // Usar configuração padrão
  }

  // Buscar cotações
  useEffect(() => {
    async function fetchCurrencies() {
      try {
        // Usar API de cotação (AwesomeAPI é gratuita e não precisa de chave)
        const currencyList = config.currencies.join(',');
        const response = await fetch(
          `https://economia.awesomeapi.com.br/json/last/${currencyList.replace(/,/g, '-BRL,')}-BRL`
        );
        const data = await response.json();

        const formattedData: CurrencyData[] = Object.keys(data).map(key => {
          const curr = data[key];
          return {
            code: curr.code,
            name: CURRENCY_INFO[curr.code]?.name || curr.name,
            buy: parseFloat(curr.bid),
            sell: parseFloat(curr.ask),
            variation: parseFloat(curr.pctChange),
          };
        });

        setCurrencies(formattedData);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Erro ao buscar cotações:', error);
        // Dados mock para fallback
        setCurrencies([
          { code: 'USD', name: 'Dólar Americano', buy: 4.95, sell: 4.97, variation: 0.15 },
          { code: 'EUR', name: 'Euro', buy: 5.42, sell: 5.45, variation: -0.23 },
          { code: 'BTC', name: 'Bitcoin', buy: 320000, sell: 321000, variation: 2.5 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrencies();
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchCurrencies, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [config.currencies]);

  // Countdown
  useEffect(() => {
    const duration = item.durationSeconds || 20;
    setCountdown(duration);

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        const newValue = prev - 1;
        if (onTimeUpdate) {
          onTimeUpdate(Math.max(0, newValue));
        }
        return Math.max(0, newValue);
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [item.durationSeconds, onTimeUpdate]);

  const formatCurrency = (value: number, code: string) => {
    if (code === 'BTC' || code === 'ETH') {
      return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  return (
    <div
      className="w-full h-screen flex flex-col p-12"
      style={{ backgroundColor: config.bgColor }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="" className="h-16 object-contain" />
          ) : (
            <h1
              className="text-5xl font-bold"
              style={{ color: config.textColor }}
            >
              {config.title}
            </h1>
          )}
        </div>
        <div className="text-right" style={{ color: config.textColor, opacity: 0.6 }}>
          <p className="text-lg">Última atualização</p>
          <p className="text-2xl font-semibold">
            {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Cotações */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-4xl animate-pulse" style={{ color: config.textColor }}>
            Carregando cotações...
          </div>
        </div>
      ) : (
        <div className="flex-1 grid gap-6">
          {currencies.map((currency, index) => (
            <div
              key={currency.code}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 flex items-center justify-between"
              style={{
                animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="flex items-center gap-6">
                {/* Ícone da moeda */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-bold"
                  style={{ backgroundColor: config.accentColor, color: config.bgColor }}
                >
                  {CURRENCY_INFO[currency.code]?.icon || currency.code[0]}
                </div>
                <div>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: config.textColor }}
                  >
                    {currency.code}
                  </p>
                  <p
                    className="text-xl"
                    style={{ color: config.textColor, opacity: 0.6 }}
                  >
                    {currency.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                {/* Compra */}
                <div className="text-center">
                  <p
                    className="text-lg mb-1"
                    style={{ color: config.textColor, opacity: 0.6 }}
                  >
                    Compra
                  </p>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: config.textColor }}
                  >
                    {formatCurrency(currency.buy, currency.code)}
                  </p>
                </div>

                {/* Venda */}
                <div className="text-center">
                  <p
                    className="text-lg mb-1"
                    style={{ color: config.textColor, opacity: 0.6 }}
                  >
                    Venda
                  </p>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: config.textColor }}
                  >
                    {formatCurrency(currency.sell, currency.code)}
                  </p>
                </div>

                {/* Variação */}
                <div className="text-center">
                  <p
                    className="text-lg mb-1"
                    style={{ color: config.textColor, opacity: 0.6 }}
                  >
                    Variação
                  </p>
                  <div
                    className={`text-4xl font-bold flex items-center gap-2 ${
                      currency.variation >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {currency.variation >= 0 ? '▲' : '▼'}
                    {Math.abs(currency.variation).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rodapé */}
      <div
        className="mt-8 text-center text-lg"
        style={{ color: config.textColor, opacity: 0.4 }}
      >
        Valores de referência. Consulte sua instituição financeira.
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
