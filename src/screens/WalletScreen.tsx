import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Copy,
  Check,
  ExternalLink,
  Clock,
  TrendingUp,
  TrendingDown,
  X,
  Building2,
  Coins,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import Container from '../components/ui/Container';
import { api } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

// Crypto currency types
type CryptoCurrency = 'BNB' | 'USDT' | 'USDC' | 'ETH' | 'CHZ' | 'LGBT' | 'SOL';

interface Package {
  id: string;
  logo?: string;
  name: {
    en: string;
    tr: string;
  };
  web_sku: string;
  priceUSD: number;
  description: {
    en: string;
    tr: string;
  };
  appstore_sku?: string;
  googleplay_sku?: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  currency: CryptoCurrency;
  amount: string;
  amountUSD: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  txHash?: string;
  address?: string;
}

interface WalletScreenProps {
  inline?: boolean;
}

interface IBANDetail {
  iban: string;
  kind: string;
  logo?: string;
  country: string;
  currency: string;
  bank_name: string;
  swift_bic: string;
  branch_code: string;
  branch_name: string;
  description: string;
  account_holder: string;
  bank_short_name: string;
}

interface GooglePayProvider {
  logo?: string;
  name: string;
  gateway: string;
  version: string;
  public_key: string;
}

interface GooglePayDetail {
  logo?: string;
  name?: string;
  api_key?: string;
  description?: string;
  environment: 'TEST' | 'PRODUCTION';
  merchant_id: string;
  provider: GooglePayProvider;
}

interface CryptoDetail {
  kind: string;
  logo?: string;
  name: string;
  symbol: string;
  chain_id: string;
  decimals: string;
  contract_address: string;
}

interface PaymentMethodsResponse {
  id: string;
  kind: string;
  iban_details: IBANDetail[];
  is_iban_enabled: boolean;
  crypto_details: CryptoDetail[];
  is_crypto_enabled: boolean;
  google_pay_details: GooglePayDetail[];
  is_google_pay_enabled: boolean;
  packages: Package[];
  created_at: string;
  updated_at: string;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ inline = false }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [depositCurrency, setDepositCurrency] = useState<CryptoCurrency>('SOL');
  const [withdrawCurrency, setWithdrawCurrency] = useState<CryptoCurrency>('LGBT');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositDropdown, setShowDepositDropdown] = useState(false);
  const [showWithdrawDropdown, setShowWithdrawDropdown] = useState(false);
  const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] = useState(false);
  const [showPackageDropdown, setShowPackageDropdown] = useState(false);
  const [showIbanDropdown, setShowIbanDropdown] = useState(false);
  const [showGooglePayProviderDropdown, setShowGooglePayProviderDropdown] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<'iban' | 'crypto' | 'google_pay'>('google_pay');
  const [selectedGooglePayProvider, setSelectedGooglePayProvider] = useState<GooglePayDetail | null>(null);

  // Helper function to set default payment method based on API kind and enabled flags
  const setDefaultPaymentMethod = () => {
    if (!paymentMethods) return;

    // Check enabled flags and set default payment method
    if (paymentMethods.is_google_pay_enabled && (paymentMethods.kind === 'google_play' || paymentMethods.kind === 'google_pay')) {
      setDepositPaymentMethod('google_pay');
    } else if (paymentMethods.is_iban_enabled && paymentMethods.kind === 'iban') {
      setDepositPaymentMethod('iban');
    } else if (paymentMethods.is_crypto_enabled && paymentMethods.kind === 'crypto') {
      setDepositPaymentMethod('crypto');
    } else {
      // Fallback: set first available enabled method
      if (paymentMethods.is_google_pay_enabled) {
        setDepositPaymentMethod('google_pay');
      } else if (paymentMethods.is_iban_enabled) {
        setDepositPaymentMethod('iban');
      } else if (paymentMethods.is_crypto_enabled) {
        setDepositPaymentMethod('crypto');
      }
    }
  };
  const [googlePayAmount, setGooglePayAmount] = useState<string>('');
  const [googlePayReady, setGooglePayReady] = useState(false);
  const [isGooglePayProcessing, setIsGooglePayProcessing] = useState(false);
  const [isGooglePayLoading, setIsGooglePayLoading] = useState(false);
  const [depositStep, setDepositStep] = useState<'payment_method' | 'package' | 'payment_screen' | 'success' | 'error'>('payment_method');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsResponse | null>(null);
  const [selectedIban, setSelectedIban] = useState<IBANDetail | null>(null);

  const depositDropdownRef = useRef<HTMLDivElement>(null);
  const withdrawDropdownRef = useRef<HTMLDivElement>(null);
  const paymentMethodDropdownRef = useRef<HTMLDivElement>(null);
  const packageDropdownRef = useRef<HTMLDivElement>(null);
  const googlePayButtonRef = useRef<HTMLDivElement>(null);
  const ibanDropdownRef = useRef<HTMLDivElement>(null);
  const googlePayProviderDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch payment methods on component mount
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await api.handleFetchPaymentMethods();
        setPaymentMethods(response as PaymentMethodsResponse);

        // Set default payment method based on API kind
        const paymentMethodsData = response as PaymentMethodsResponse;
        const kind = paymentMethodsData.kind;

        // Set default payment method based on kind and enabled flags
        if (paymentMethodsData.is_google_pay_enabled && (kind === 'google_play' || kind === 'google_pay')) {
          setDepositPaymentMethod('google_pay');
          // Set first Google Pay provider as default if available
          if (paymentMethodsData.google_pay_details && paymentMethodsData.google_pay_details.length > 0) {
            setSelectedGooglePayProvider(paymentMethodsData.google_pay_details[0]);
          }
        } else if (paymentMethodsData.is_iban_enabled && kind === 'iban') {
          setDepositPaymentMethod('iban');
          // Set first IBAN as default if available
          if (paymentMethodsData.iban_details && paymentMethodsData.iban_details.length > 0) {
            setSelectedIban(paymentMethodsData.iban_details[0]);
          }
        } else if (paymentMethodsData.is_crypto_enabled && kind === 'crypto') {
          setDepositPaymentMethod('crypto');
          // Set first Crypto as default if available
          if (paymentMethodsData.crypto_details && paymentMethodsData.crypto_details.length > 0) {
            const firstCrypto = paymentMethodsData.crypto_details[0];
            setDepositCurrency(firstCrypto.symbol as CryptoCurrency);
          }
        } else {
          // Fallback: set first available enabled method
          if (paymentMethodsData.is_google_pay_enabled) {
            setDepositPaymentMethod('google_pay');
            if (paymentMethodsData.google_pay_details && paymentMethodsData.google_pay_details.length > 0) {
              setSelectedGooglePayProvider(paymentMethodsData.google_pay_details[0]);
            }
          } else if (paymentMethodsData.is_iban_enabled) {
            setDepositPaymentMethod('iban');
            if (paymentMethodsData.iban_details && paymentMethodsData.iban_details.length > 0) {
              setSelectedIban(paymentMethodsData.iban_details[0]);
            }
          } else if (paymentMethodsData.is_crypto_enabled) {
            setDepositPaymentMethod('crypto');
            if (paymentMethodsData.crypto_details && paymentMethodsData.crypto_details.length > 0) {
              const firstCrypto = paymentMethodsData.crypto_details[0];
              setDepositCurrency(firstCrypto.symbol as CryptoCurrency);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (depositDropdownRef.current && !depositDropdownRef.current.contains(event.target as Node)) {
        setShowDepositDropdown(false);
      }
      if (withdrawDropdownRef.current && !withdrawDropdownRef.current.contains(event.target as Node)) {
        setShowWithdrawDropdown(false);
      }
      if (paymentMethodDropdownRef.current && !paymentMethodDropdownRef.current.contains(event.target as Node)) {
        setShowPaymentMethodDropdown(false);
      }
      if (packageDropdownRef.current && !packageDropdownRef.current.contains(event.target as Node)) {
        setShowPackageDropdown(false);
      }
      if (ibanDropdownRef.current && !ibanDropdownRef.current.contains(event.target as Node)) {
        setShowIbanDropdown(false);
      }
      if (googlePayProviderDropdownRef.current && !googlePayProviderDropdownRef.current.contains(event.target as Node)) {
        setShowGooglePayProviderDropdown(false);
      }
    };

    if (showDepositDropdown || showWithdrawDropdown || showPaymentMethodDropdown || showPackageDropdown || showIbanDropdown || showGooglePayProviderDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDepositDropdown, showWithdrawDropdown, showPaymentMethodDropdown, showPackageDropdown, showIbanDropdown, showGooglePayProviderDropdown]);

  // Load Google Pay script and initialize
  useEffect(() => {
    if (depositPaymentMethod !== 'google_pay' || !showDepositModal || depositStep !== 'payment_screen') {
      setIsGooglePayLoading(false);
      setGooglePayReady(false);
      if (googlePayButtonRef.current) {
        googlePayButtonRef.current.innerHTML = '';
      }
      return;
    }

    const GOOGLE_PAY_SCRIPT_URL = 'https://pay.google.com/gp/p/js/pay.js';

    // Set loading state when starting
    setIsGooglePayLoading(true);
    setGooglePayReady(false);

    // Clear any existing button
    if (googlePayButtonRef.current) {
      googlePayButtonRef.current.innerHTML = '';
    }

    const handleGooglePaySuccess = async (paymentData: unknown) => {
      console.log("GelenData", paymentData)
      try {
        // TODO: Send paymentData to your backend for processing
        // const response = await api.processGooglePayPayment({
        //   paymentData,
        //   amount: googlePayAmount
        // });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock successful payment
        console.log('Google Pay payment successful:', paymentData);

        setIsGooglePayProcessing(false);
        setDepositStep('success');

        // TODO: Update wallet balance and transaction history
      } catch (error) {
        console.error('Error processing Google Pay payment:', error);
        setIsGooglePayProcessing(false);
        setDepositStep('error');
        throw error; // Re-throw to be caught by onPaymentAuthorized
      }
    };

    const handleGooglePayError = (error: unknown) => {
      console.error('Google Pay error:', error);
      setIsGooglePayProcessing(false);
      setDepositStep('error');
    };

    // Payment authorization callback
    const onPaymentAuthorized = (paymentData: unknown) => {
      return new Promise((resolve) => {
        // Process payment
        handleGooglePaySuccess(paymentData)
          .then(() => {
            // Return success response
            resolve({
              transactionState: 'SUCCESS' as const
            });
          })
          .catch((error) => {
            console.error('Payment authorization failed:', error);
            // Return error response
            resolve({
              transactionState: 'ERROR' as const,
              error: {
                intent: 'PAYMENT_AUTHORIZATION',
                message: 'Payment processing failed',
                reason: 'PAYMENT_DATA_INVALID'
              }
            });
          });
      });
    };

    const initializeGooglePay = () => {
      try {
        // Get selected Google Pay provider
        const googlePayDetail = selectedGooglePayProvider;
        if (!googlePayDetail) {
          console.log('Google Pay provider not selected');
          setIsGooglePayLoading(false);
          return;
        }


        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const google = (window as any).google;
        if (google?.payments?.api?.PaymentsClient) {
          const paymentsClient = new google.payments.api.PaymentsClient({
            environment: googlePayDetail.environment || 'TEST',
            merchantInfo: {
              merchantName: googlePayDetail.description || 'CoolVibes',
              merchantId: googlePayDetail.merchant_id
            },
            paymentDataCallbacks: {
              onPaymentAuthorized: onPaymentAuthorized
            }
          });

          // Check if Google Pay is available
          const provider = googlePayDetail.provider;
          // Build tokenization parameters based on gateway type
          const tokenizationParams: Record<string, string> = {
            gateway: provider?.gateway || 'stripe'
          };

          // Stripe-specific parameters
          if (provider?.gateway === 'stripe') {
            tokenizationParams['stripe:publishableKey'] = provider?.public_key || '';
            tokenizationParams['stripe:version'] = provider?.version || '2020-08-27';
          } else {
            // For other gateways, use gatewayMerchantId
            tokenizationParams.gatewayMerchantId = provider?.public_key || '';
          }

          console.log("TOKENIZED PARAMS", tokenizationParams)

          paymentsClient.isReadyToPay({
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [
              {
                type: 'CARD',
                parameters: {
                  allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                  allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"]
                },
                tokenizationSpecification: {
                  type: 'PAYMENT_GATEWAY',
                  parameters: tokenizationParams
                }
              }
            ],
            existingPaymentMethodRequired: true
          }).then((response: { result: boolean }) => {
            if (response.result) {
              setGooglePayReady(true);
              setIsGooglePayLoading(false);
              // Small delay to ensure ref is ready
              setTimeout(() => {
                renderGooglePayButton(paymentsClient);
              }, 100);
            } else {
              console.log('Google Pay is not available');
              setGooglePayReady(false);
              setIsGooglePayLoading(false);
            }
          }).catch((error: unknown) => {
            console.error('Error checking Google Pay availability:', error);
            setGooglePayReady(false);
            setIsGooglePayLoading(false);
          });
        } else {
          console.log('Google Pay API not found');
          setIsGooglePayLoading(false);
        }
      } catch (error) {
        console.error('Error initializing Google Pay:', error);
        setGooglePayReady(false);
        setIsGooglePayLoading(false);
      }
    };

    const renderGooglePayButton = (paymentsClient: unknown) => {
      if (!googlePayButtonRef.current) {
        console.log('Google Pay button ref not ready, retrying...');
        setTimeout(() => renderGooglePayButton(paymentsClient), 100);
        return;
      }

      try {
        // Clear existing content
        googlePayButtonRef.current.innerHTML = '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const button = (paymentsClient as any).createButton({
          onClick: onGooglePayButtonClick(paymentsClient),
          buttonColor: theme === 'dark' ? 'white' : 'black',
          buttonType: 'pay',
          buttonSizeMode: 'fill',
          buttonLocale: "en",
        });

        googlePayButtonRef.current.appendChild(button);
        console.log('Google Pay button rendered');
      } catch (error) {
        console.error('Error rendering Google Pay button:', error);
        setGooglePayReady(false);
        setIsGooglePayLoading(false);
      }
    };

    const onGooglePayButtonClick = (paymentsClient: unknown) => {
      return () => {
        if (!googlePayAmount || parseFloat(googlePayAmount) <= 0) {
          return;
        }

        // Get selected Google Pay provider
        const googlePayDetail = selectedGooglePayProvider;
        if (!googlePayDetail) {
          console.error('Google Pay provider not selected');
          return;
        }

        setIsGooglePayProcessing(true);

        const provider = googlePayDetail.provider;
        // Build tokenization parameters based on gateway type
        const tokenizationParams: Record<string, string> = {
          gateway: provider?.gateway || 'stripe'
        };

        // Stripe-specific parameters
        if (provider?.gateway === 'stripe') {
          tokenizationParams['stripe:publishableKey'] = provider?.public_key || '';
          tokenizationParams['stripe:version'] = provider?.version || '2020-08-27';
        } else {
          // For other gateways, use gatewayMerchantId
          tokenizationParams.gatewayMerchantId = provider?.public_key || '';
        }

        const paymentDataRequest = {
          apiVersion: 2,
          apiVersionMinor: 0,
          merchantInfo: {
            merchantId: googlePayDetail.merchant_id,
            merchantName: googlePayDetail.description || 'CoolVibes'
          },
          allowedPaymentMethods: [
            {
              type: 'CARD',
              parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"]
              },
              tokenizationSpecification: {
                type: 'PAYMENT_GATEWAY',
                parameters: tokenizationParams
              }
            }
          ],
          transactionInfo: {
            totalPriceStatus: 'FINAL',
            totalPriceLabel: 'Total',
            totalPrice: googlePayAmount,
            currencyCode: 'USD',
            countryCode: 'US'
          },
          callbackIntents: ['PAYMENT_AUTHORIZATION'],
          emailRequired: true
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (paymentsClient as any).loadPaymentData(paymentDataRequest)
          .then(() => {
            // This will be called after onPaymentAuthorized resolves
            console.log('Payment authorized successfully');
          })
          .catch((error: unknown) => {
            handleGooglePayError(error);
          });
      };
    };

    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${GOOGLE_PAY_SCRIPT_URL}"]`);

    // Load Google Pay script if not already loaded
    // @ts-expect-error - Google Pay API is attached to the window
    if (window.google?.payments?.api?.PaymentsClient) {
      // API is already available, initialize immediately
      initializeGooglePay();
    } else if (existingScript) {
      // Script exists but API not ready yet, wait for it
      const checkInterval = setInterval(() => {
        // @ts-expect-error - Google Pay API is attached to the window
        if (window.google?.payments?.api?.PaymentsClient) {
          clearInterval(checkInterval);
          initializeGooglePay();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!googlePayReady) {
          console.log('Google Pay script loading timeout');
          setIsGooglePayLoading(false);
        }
      }, 5000);
    } else {
      // Script doesn't exist, load it
      const script = document.createElement('script');
      script.src = GOOGLE_PAY_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        setTimeout(() => {
          initializeGooglePay();
        }, 200);
      };
      script.onerror = () => {
        console.error('Failed to load Google Pay script');
        setGooglePayReady(false);
        setIsGooglePayLoading(false);
      };
      document.body.appendChild(script);
    }

    const currentRef = googlePayButtonRef.current;
    return () => {
      if (currentRef) {
        currentRef.innerHTML = '';
      }
      setGooglePayReady(false);
      setIsGooglePayLoading(false);
    };
  }, [depositPaymentMethod, showDepositModal, depositStep, googlePayAmount, theme, paymentMethods, selectedGooglePayProvider, googlePayReady]);

  // Total USD balance from user auth
  const totalBalanceUSD = user?.balance !== undefined ? (Number(user.balance) || 0).toFixed(2) : '0.00';

  // Get packages from API or use empty array
  const packages: Package[] = paymentMethods?.packages || [];

  // Mock transaction history - Replace with actual API calls
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'deposit',
      currency: 'LGBT',
      amount: '1000',
      amountUSD: '-',
      status: 'completed',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      txHash: 'https://coolvibes.lgbt'
    },
  ]);


  // Get deposit address - Single address for all currencies - Replace with actual API calls
  const getDepositAddress = (): string => {
    // Single address for all currencies - Replace with actual API calls
    return 'AuxPrz4dnh7KfytKZPgcrGgch1BhkLW3hu1dRnNgTByA';
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress) {
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Implement withdraw logic
      // await api.withdraw(withdrawCurrency, withdrawAmount, withdrawAddress);

      // Reset form
      setWithdrawAmount('');
      setWithdrawAddress('');
      setShowWithdrawModal(false);
    } catch (error) {
      console.error('Withdraw failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCurrencyIcon = (currency: CryptoCurrency) => {
    switch (currency) {
      case 'BNB':
        return '🟡';
      case 'USDT':
        return '💵';
      case 'USDC':
        return '💵';
      case 'ETH':
        return '💵';
      case 'CHZ':
        return '💵';
      case 'LGBT':
        return '💦';
      default:
        return '💰';
    }
  };

  const getPackageIcon = (packageName: string | { en: string; tr: string }) => {
    const name = typeof packageName === 'string' ? packageName : (packageName.en || packageName.tr);
    if (name.includes('Bronze') || name.includes('Aldebaran')) return '🥉';
    if (name.includes('Silver') || name.includes('Bellatrix')) return '🥈';
    if (name.includes('Gold') || name.includes('Alnitak')) return '🥇';
    if (name.includes('Platinum') || name.includes('Alcyone')) return '💎';
    if (name.includes('Diamond') || name.includes('Mintaka')) return '💠';
    if (name.includes('Elite') || name.includes('Rigel') || name.includes('Fomalhaut') || name.includes('Antares') || name.includes('Deneb') || name.includes('Sadalsuud')) return '👑';
    return '📦';
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600';
      case 'pending':
        return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
      case 'failed':
        return theme === 'dark' ? 'text-red-400' : 'text-red-600';
      default:
        return theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const content = (
    <>
      {/* Header */}
      {!inline && (
        <div className={`sticky top-0 z-30 ${theme === 'dark' ? 'bg-gray-950' : 'bg-white'} border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200/50'}`}>
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full transition-all duration-200 mr-3 ${theme === 'dark' ? 'hover:bg-gray-900/50' : 'hover:bg-gray-100'}`}
            >
              <ArrowLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className="flex-1">
              <h1 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('wallet.title') || 'Wallet'}
              </h1>
            </div>
            <div className="w-12"></div>
          </div>
        </div>
      )}

      <div className="max-w-[1380px] mx-auto">
        <main className={`flex-1 w-full min-w-0 ${theme === 'dark' ? 'border-x border-gray-900' : 'border-x border-gray-200/50'}`}>
          <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-white'}`}>
            <div className={`max-w-4xl mx-auto border-x ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200/50'}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Tabs */}
                <div className={`sticky z-20 border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200/50'} backdrop-blur-sm ${theme === 'dark' ? 'bg-gray-950/95' : 'bg-white/95'}`} style={{ top: inline ? '0' : '57px' }}>
                  <div className="flex px-4 sm:px-6 relative">
                    {[
                      { id: 'overview', label: t('wallet.overview') || 'Overview' },
                      { id: 'history', label: t('wallet.history') || 'History' },
                    ].map((tab) => (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'overview' | 'history')}
                        className={`flex-1 py-3 font-semibold text-sm relative transition-colors ${activeTab === tab.id
                          ? theme === 'dark' ? 'text-white' : 'text-black'
                          : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="relative z-10">{tab.label}</span>
                        {activeTab === tab.id && (
                          <motion.div
                            className={`absolute bottom-0 left-0 right-0 h-1 rounded-t-full ${theme === 'dark' ? 'bg-white' : 'bg-gray-900'}`}
                            layoutId="walletTabIndicator"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                              mass: 0.8
                            }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="px-4 sm:px-6 py-6">
                  <AnimatePresence mode="wait" initial={false}>
                    {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="space-y-6"
                      >
                        {/* Balance Card */}
                        <div className={`rounded-2xl overflow-hidden transition-all duration-200 ${theme === 'dark'
                          ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/50 border border-gray-800/60'
                          : 'bg-white border border-gray-200/90'
                          }`}>
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {t('wallet.balance') || 'Total Balance'}
                                </p>
                                <h2 className={`text-3xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  ${totalBalanceUSD} LGBT
                                </h2>
                              </div>
                              <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                <Wallet className={`w-8 h-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6">
                              <motion.button
                                onClick={() => {
                                  setDepositStep('payment_method');
                                  setSelectedPackage(null);
                                  setDepositAmount('');
                                  setDepositPaymentMethod('google_pay');
                                  // Reset to default payment method from API based on enabled flags
                                  if (paymentMethods?.is_google_pay_enabled && (paymentMethods?.kind === 'google_play' || paymentMethods?.kind === 'google_pay')) {
                                    setDepositPaymentMethod('google_pay');
                                  } else if (paymentMethods?.is_iban_enabled && paymentMethods?.kind === 'iban') {
                                    setDepositPaymentMethod('iban');
                                  } else if (paymentMethods?.is_crypto_enabled && paymentMethods?.kind === 'crypto') {
                                    setDepositPaymentMethod('crypto');
                                  } else {
                                    // Fallback: set first available enabled method
                                    if (paymentMethods?.is_google_pay_enabled) {
                                      setDepositPaymentMethod('google_pay');
                                    } else if (paymentMethods?.is_iban_enabled) {
                                      setDepositPaymentMethod('iban');
                                    } else if (paymentMethods?.is_crypto_enabled) {
                                      setDepositPaymentMethod('crypto');
                                    }
                                  }
                                  setShowDepositModal(true);
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${theme === 'dark'
                                  ? 'bg-white text-black hover:bg-gray-200'
                                  : 'bg-gray-900 text-white hover:bg-gray-800'
                                  }`}
                              >
                                <ArrowDownCircle className="w-5 h-5" />
                                {t('wallet.deposit') || 'Deposit'}
                              </motion.button>
                              <motion.button
                                onClick={() => {
                                  setWithdrawCurrency('LGBT');
                                  setShowWithdrawModal(true);
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${theme === 'dark'
                                  ? 'bg-transparent border-gray-700 text-white hover:bg-gray-900/50'
                                  : 'bg-transparent border-gray-300 text-gray-900 hover:bg-gray-50'
                                  }`}
                              >
                                <ArrowUpCircle className="w-5 h-5" />
                                {t('wallet.withdraw') || 'Withdraw'}
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'history' && (
                      <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="space-y-4"
                      >
                        {/* Transactions List */}
                        {transactions.length > 0 ? (
                          <div className="space-y-3">
                            {transactions.map((transaction) => (
                              <motion.div
                                key={transaction.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-xl overflow-hidden transition-all duration-200 ${theme === 'dark'
                                  ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/50 border border-gray-800/60'
                                  : 'bg-white border border-gray-200/90'
                                  }`}
                              >
                                <div className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${transaction.type === 'deposit'
                                        ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                                        : theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
                                        }`}>
                                        {transaction.type === 'deposit' ? (
                                          <TrendingDown className="w-5 h-5" />
                                        ) : (
                                          <TrendingUp className="w-5 h-5" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {transaction.type === 'deposit'
                                              ? (t('wallet.deposit') || 'Deposit')
                                              : (t('wallet.withdraw') || 'Withdraw')
                                            }
                                          </h4>
                                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(transaction.status)} ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                            }`}>
                                            {transaction.status}
                                          </span>
                                        </div>
                                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                          {formatDate(transaction.timestamp)}
                                        </p>
                                        {transaction.txHash && (
                                          <button
                                            onClick={() => window.open(`https://coolvibes.lgbt`, '_blank')}
                                            className={`flex items-center gap-1 mt-1 text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                            View on Explorer
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className={`text-sm font-semibold ${transaction.type === 'deposit'
                                        ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                                        : theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                                        }`}>
                                        {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount} {transaction.currency}
                                      </p>
                                      <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        ≈ ${transaction.amountUSD} USD
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className={`py-16 text-center rounded-2xl ${theme === 'dark'
                            ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/50 border border-gray-800/60'
                            : 'bg-white border border-gray-200/90'
                            }`}>
                            <Clock className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {t('wallet.no_transactions') || 'No transactions yet'}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDepositModal(false);
              setSelectedPackage(null);
              setGooglePayAmount('');
              setDepositAmount('');
              setDepositStep('payment_method');
              setDefaultPaymentMethod();
              setShowPackageDropdown(false);
              setShowPaymentMethodDropdown(false);
              setShowDepositDropdown(false);
              setShowGooglePayProviderDropdown(false);
              // Reset Google Pay states
              setSelectedGooglePayProvider(null);
              setGooglePayReady(false);
              setIsGooglePayLoading(false);
              setIsGooglePayProcessing(false);
              if (googlePayButtonRef.current) {
                googlePayButtonRef.current.innerHTML = '';
              }
            }}
          >
            <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-lg rounded-2xl ${theme === 'dark'
                ? 'bg-gray-900 border border-gray-800'
                : 'bg-white border border-gray-200'
                }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('wallet.deposit') || 'Deposit'}
                  </h3>
                  <button
                    onClick={() => {
                      if (depositStep === 'payment_method') {
                        setShowDepositModal(false);
                        setSelectedPackage(null);
                        setGooglePayAmount('');
                        setDepositAmount('');
                        setDepositStep('payment_method');
                        setDefaultPaymentMethod();
                        setShowGooglePayProviderDropdown(false);
                        // Reset Google Pay states
                        setSelectedGooglePayProvider(null);
                        setGooglePayReady(false);
                        setIsGooglePayLoading(false);
                        setIsGooglePayProcessing(false);
                        if (googlePayButtonRef.current) {
                          googlePayButtonRef.current.innerHTML = '';
                        }
                      } else if (depositStep === 'package') {
                        setDepositStep('payment_method');
                        setSelectedPackage(null);
                        setGooglePayAmount('');
                      } else if (depositStep === 'payment_screen') {
                        if (depositPaymentMethod === 'google_pay') {
                          setDepositStep('package');
                        } else {
                          setDepositStep('payment_method');
                          setDepositAmount('');
                        }
                      } else if (depositStep === 'success' || depositStep === 'error') {
                        setShowDepositModal(false);
                        setSelectedPackage(null);
                        setGooglePayAmount('');
                        setDepositAmount('');
                        setDepositStep('payment_method');
                        setDefaultPaymentMethod();
                        setShowGooglePayProviderDropdown(false);
                        // Reset Google Pay states
                        setSelectedGooglePayProvider(null);
                        setGooglePayReady(false);
                        setIsGooglePayLoading(false);
                        setIsGooglePayProcessing(false);
                        if (googlePayButtonRef.current) {
                          googlePayButtonRef.current.innerHTML = '';
                        }
                      }
                    }}
                    className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  >
                    <ArrowLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {/* Step 1: Payment Method Selection */}
                  {depositStep === 'payment_method' && (
                    <motion.div
                      key="payment-method-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Payment Method Selection */}
                      <div>
                        <label className={`flex items-center gap-1.5 mb-2 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>
                          <Wallet className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold tracking-tight">{t('wallet.payment_method') || 'Payment Method'} *</span>
                        </label>
                        <div className="relative" ref={paymentMethodDropdownRef}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPaymentMethodDropdown(!showPaymentMethodDropdown);
                            }}
                            className={`w-full px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:outline-none focus:ring-1 font-medium text-left flex items-center justify-between ${theme === 'dark'
                              ? 'bg-gray-900/50 border-gray-800 text-white focus:border-gray-700 focus:ring-gray-800/50 hover:border-gray-700'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400 focus:ring-gray-300/40 hover:border-gray-400'
                              }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                }`}>
                                {depositPaymentMethod === 'iban' && paymentMethods?.is_iban_enabled ? (
                                  <Building2 className="w-5 h-5" />
                                ) : depositPaymentMethod === 'google_pay' && paymentMethods?.is_google_pay_enabled ? (
                                  paymentMethods?.google_pay_details?.[0]?.logo ? (
                                    <img
                                      src={paymentMethods.google_pay_details[0].logo}
                                      alt="Google Pay"
                                      className="w-full h-full object-contain p-1"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          const fallback = document.createElement('span');
                                          fallback.className = 'text-lg font-bold';
                                          fallback.textContent = 'G';
                                          parent.appendChild(fallback);
                                        }
                                      }}
                                    />
                                  ) : (
                                    <span className="text-lg font-bold">G</span>
                                  )
                                ) : depositPaymentMethod === 'crypto' && paymentMethods?.is_crypto_enabled ? (
                                  <Coins className="w-5 h-5" />
                                ) : (
                                  <Wallet className="w-5 h-5" />
                                )}
                              </div>
                              <span className={`text-sm font-semibold ${depositPaymentMethod ? '' : 'opacity-50'}`}>
                                {depositPaymentMethod === 'iban' && paymentMethods?.is_iban_enabled ? (t('wallet.iban_transfer') || 'IBAN Transfer') :
                                  depositPaymentMethod === 'google_pay' && paymentMethods?.is_google_pay_enabled ? (t('wallet.google_pay') || 'Google Pay') :
                                    depositPaymentMethod === 'crypto' && paymentMethods?.is_crypto_enabled ? (t('wallet.crypto') || 'Crypto') :
                                      (t('wallet.select_payment_method') || 'Select payment method')}
                              </span>
                            </div>
                            <motion.div
                              animate={{ rotate: showPaymentMethodDropdown ? 180 : 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="flex-shrink-0"
                            >
                              <X className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-200 ${showPaymentMethodDropdown ? 'rotate-45' : ''}`} />
                            </motion.div>
                          </button>

                          {/* Payment Method Picker - Dropdown */}
                          <AnimatePresence>
                            {showPaymentMethodDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-lg overflow-hidden ${theme === 'dark'
                                  ? 'bg-gray-950 border-gray-800'
                                  : 'bg-white border-gray-200 shadow-gray-900/10'
                                  }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Payment Method Options - Square Grid Layout */}
                                <div className="p-3">
                                  <div className="grid grid-cols-3 gap-2.5">
                                    {/* IBAN Transfer - Show always, but disabled if not enabled */}
                                    <motion.button
                                      type="button"
                                      onClick={() => {
                                        if (paymentMethods?.is_iban_enabled) {
                                          setDepositPaymentMethod('iban');
                                          setShowPaymentMethodDropdown(false);
                                        }
                                      }}
                                      disabled={!paymentMethods?.is_iban_enabled}
                                      whileHover={paymentMethods?.is_iban_enabled ? { scale: 1.05, y: -2 } : {}}
                                      whileTap={paymentMethods?.is_iban_enabled ? { scale: 0.92 } : {}}
                                      transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 20,
                                        scale: { duration: 0.1 }
                                      }}
                                      className={`relative aspect-square rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-2 ${!paymentMethods?.is_iban_enabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                        } ${depositPaymentMethod === 'iban' && paymentMethods?.is_iban_enabled
                                          ? theme === 'dark'
                                            ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                                            : 'bg-gray-900 text-white shadow-lg ring-2 ring-gray-900/50'
                                          : theme === 'dark'
                                            ? 'bg-gray-900/50 hover:bg-gray-800/70 text-white border border-gray-800'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                                        }`}
                                    >
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${depositPaymentMethod === 'iban' && paymentMethods?.is_iban_enabled
                                        ? theme === 'dark' ? 'bg-black/10' : 'bg-white/20'
                                        : theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                        }`}>
                                        <Building2 className="w-5 h-5" />
                                      </div>
                                      <span className="text-xs font-bold whitespace-nowrap">{t('wallet.iban') || 'IBAN'}</span>
                                      {depositPaymentMethod === 'iban' && paymentMethods?.is_iban_enabled && (
                                        <motion.div
                                          initial={{ scale: 0, rotate: -180 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                          className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
                                            }`}
                                        >
                                          <Check className="w-3 h-3" />
                                        </motion.div>
                                      )}
                                    </motion.button>

                                    {/* Crypto - Show always, but disabled if not enabled */}
                                    <motion.button
                                      type="button"
                                      onClick={() => {
                                        if (paymentMethods?.is_crypto_enabled) {
                                          setDepositPaymentMethod('crypto');
                                          setShowPaymentMethodDropdown(false);
                                        }
                                      }}
                                      disabled={!paymentMethods?.is_crypto_enabled}
                                      whileHover={paymentMethods?.is_crypto_enabled ? { scale: 1.05, y: -2 } : {}}
                                      whileTap={paymentMethods?.is_crypto_enabled ? { scale: 0.92 } : {}}
                                      transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 20,
                                        scale: { duration: 0.1 }
                                      }}
                                      className={`relative aspect-square rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-2 ${!paymentMethods?.is_crypto_enabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                        } ${depositPaymentMethod === 'crypto' && paymentMethods?.is_crypto_enabled
                                          ? theme === 'dark'
                                            ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                                            : 'bg-gray-900 text-white shadow-lg ring-2 ring-gray-900/50'
                                          : theme === 'dark'
                                            ? 'bg-gray-900/50 hover:bg-gray-800/70 text-white border border-gray-800'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                                        }`}
                                    >
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${depositPaymentMethod === 'crypto' && paymentMethods?.is_crypto_enabled
                                        ? theme === 'dark' ? 'bg-black/10' : 'bg-white/20'
                                        : theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                        }`}>
                                        <Coins className="w-5 h-5" />
                                      </div>
                                      <span className="text-xs font-bold whitespace-nowrap">{t('wallet.crypto') || 'Crypto'}</span>
                                      {depositPaymentMethod === 'crypto' && paymentMethods?.is_crypto_enabled && (
                                        <motion.div
                                          initial={{ scale: 0, rotate: -180 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                          className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
                                            }`}
                                        >
                                          <Check className="w-3 h-3" />
                                        </motion.div>
                                      )}
                                    </motion.button>

                                    {/* Google Pay - Show always, but disabled if not enabled */}
                                    <motion.button
                                      type="button"
                                      onClick={() => {
                                        if (paymentMethods?.is_google_pay_enabled) {
                                          setDepositPaymentMethod('google_pay');
                                          setShowPaymentMethodDropdown(false);
                                        }
                                      }}
                                      disabled={!paymentMethods?.is_google_pay_enabled}
                                      whileHover={paymentMethods?.is_google_pay_enabled ? { scale: 1.05, y: -2 } : {}}
                                      whileTap={paymentMethods?.is_google_pay_enabled ? { scale: 0.92 } : {}}
                                      transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 20,
                                        scale: { duration: 0.1 }
                                      }}
                                      className={`relative aspect-square rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-2 ${!paymentMethods?.is_google_pay_enabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                        } ${depositPaymentMethod === 'google_pay' && paymentMethods?.is_google_pay_enabled
                                          ? theme === 'dark'
                                            ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                                            : 'bg-gray-900 text-white shadow-lg ring-2 ring-gray-900/50'
                                          : theme === 'dark'
                                            ? 'bg-gray-900/50 hover:bg-gray-800/70 text-white border border-gray-800'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                                        }`}
                                    >
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 overflow-hidden ${depositPaymentMethod === 'google_pay' && paymentMethods?.is_google_pay_enabled
                                        ? theme === 'dark' ? 'bg-black/10' : 'bg-white/20'
                                        : theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                        }`}>
                                        {paymentMethods?.google_pay_details?.[0]?.logo ? (
                                          <img
                                            src={paymentMethods.google_pay_details[0].logo}
                                            alt="Google Pay"
                                            className="w-full h-full object-contain p-1"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                              const parent = target.parentElement;
                                              if (parent) {
                                                const fallback = document.createElement('span');
                                                fallback.className = 'text-lg font-bold';
                                                fallback.textContent = 'G';
                                                parent.appendChild(fallback);
                                              }
                                            }}
                                          />
                                        ) : (
                                          <span className="text-lg font-bold">G</span>
                                        )}
                                      </div>
                                      <span className="text-xs font-bold whitespace-nowrap">{t('wallet.google_pay') || 'Google Pay'}</span>
                                      {depositPaymentMethod === 'google_pay' && paymentMethods?.is_google_pay_enabled && (
                                        <motion.div
                                          initial={{ scale: 0, rotate: -180 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                          className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
                                            }`}
                                        >
                                          <Check className="w-3 h-3" />
                                        </motion.div>
                                      )}
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* IBAN Selection - Show when IBAN payment method is selected */}
                      {depositPaymentMethod === 'iban' && paymentMethods?.is_iban_enabled && (
                        <div>
                          <label className={`flex items-center gap-1.5 mb-2 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>
                            <Building2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold tracking-tight">{t('wallet.select_bank') || 'Select Bank'} *</span>
                          </label>
                          <div className="relative" ref={ibanDropdownRef}>
                            <button
                              type="button"
                              onClick={() => {
                                setShowIbanDropdown(!showIbanDropdown);
                              }}
                              className={`w-full px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:outline-none focus:ring-1 font-medium text-left flex items-center justify-between ${theme === 'dark'
                                ? 'bg-gray-900/50 border-gray-800 text-white focus:border-gray-700 focus:ring-gray-800/50 hover:border-gray-700'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400 focus:ring-gray-300/40 hover:border-gray-400'
                                }`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {selectedIban ? (
                                  <>
                                    {selectedIban.logo ? (
                                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                        <img
                                          src={selectedIban.logo}
                                          alt={selectedIban.bank_short_name}
                                          className="w-full h-full object-contain p-1"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                              const fallback = document.createElement('span');
                                              fallback.className = 'text-lg';
                                              fallback.textContent = '🏦';
                                              parent.appendChild(fallback);
                                            }
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                        <Building2 className="w-5 h-5" />
                                      </div>
                                    )}
                                    <span className={`text-sm font-semibold`}>
                                      {selectedIban.bank_short_name}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                      <Building2 className="w-5 h-5" />
                                    </div>
                                    <span className={`text-sm font-semibold opacity-50`}>
                                      {t('wallet.select_bank') || 'Select bank'}
                                    </span>
                                  </>
                                )}
                              </div>
                              <motion.div
                                animate={{ rotate: showIbanDropdown ? 180 : 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="flex-shrink-0"
                              >
                                <X className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-200 ${showIbanDropdown ? 'rotate-45' : ''}`} />
                              </motion.div>
                            </button>

                            {/* IBAN Picker - Dropdown */}
                            <AnimatePresence>
                              {showIbanDropdown && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.15, ease: 'easeOut' }}
                                  className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-lg overflow-hidden ${theme === 'dark'
                                    ? 'bg-gray-950 border-gray-800'
                                    : 'bg-white border-gray-200 shadow-gray-900/10'
                                    }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="p-3 max-h-[400px] overflow-y-auto">
                                    <div className="grid grid-cols-3 gap-2.5">
                                      {paymentMethods?.iban_details?.map((iban, index) => {
                                        const isSelected = selectedIban?.iban === iban.iban && selectedIban?.bank_short_name === iban.bank_short_name;
                                        return (
                                          <motion.button
                                            key={`${iban.bank_short_name}-${iban.iban}-${index}`}
                                            type="button"
                                            onClick={() => {
                                              setSelectedIban(iban);
                                              setShowIbanDropdown(false);
                                            }}
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.92 }}
                                            transition={{
                                              type: "spring",
                                              stiffness: 400,
                                              damping: 20,
                                              scale: { duration: 0.1 }
                                            }}
                                            className={`relative aspect-square rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-2 ${isSelected
                                              ? theme === 'dark'
                                                ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                                                : 'bg-gray-900 text-white shadow-lg ring-2 ring-gray-900/50'
                                              : theme === 'dark'
                                                ? 'bg-gray-900/50 hover:bg-gray-800/70 text-white border border-gray-800'
                                                : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                                              }`}
                                          >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 overflow-hidden ${isSelected
                                              ? theme === 'dark' ? 'bg-black/10' : 'bg-white/20'
                                              : theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                              }`}>
                                              {iban.logo ? (
                                                <img
                                                  src={iban.logo}
                                                  alt={iban.bank_short_name}
                                                  className="w-full h-full object-contain p-1"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                      const fallback = document.createElement('span');
                                                      fallback.className = 'text-lg';
                                                      fallback.textContent = '🏦';
                                                      parent.appendChild(fallback);
                                                    }
                                                  }}
                                                />
                                              ) : (
                                                <Building2 className={`w-5 h-5 ${isSelected
                                                  ? theme === 'dark' ? 'text-black' : 'text-white'
                                                  : theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                  }`} />
                                              )}
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5 px-1">
                                              <span className="text-xs font-bold leading-tight text-center line-clamp-2">{iban.bank_short_name}</span>
                                              <span className={`text-[10px] font-semibold ${isSelected
                                                ? theme === 'dark' ? 'text-black/80' : 'text-white/80'
                                                : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                }`}>
                                                {iban.currency}
                                              </span>
                                            </div>
                                            {isSelected && (
                                              <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                                className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
                                                  }`}
                                              >
                                                <Check className="w-3 h-3" />
                                              </motion.div>
                                            )}
                                          </motion.button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* Crypto Selection - Show when Crypto payment method is selected */}
                      {depositPaymentMethod === 'crypto' && paymentMethods?.is_crypto_enabled && (
                        <div>
                          <label className={`flex items-center gap-1.5 mb-2 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>
                            <Wallet className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold tracking-tight">{t('wallet.select_currency') || 'Select Currency'} *</span>
                          </label>
                          <div className="relative" ref={depositDropdownRef}>
                            <button
                              type="button"
                              onClick={() => {
                                setShowDepositDropdown(!showDepositDropdown);
                              }}
                              className={`w-full px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:outline-none focus:ring-1 font-medium text-left flex items-center justify-between ${theme === 'dark'
                                ? 'bg-gray-900/50 border-gray-800 text-white focus:border-gray-700 focus:ring-gray-800/50 hover:border-gray-700'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400 focus:ring-gray-300/40 hover:border-gray-400'
                                }`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {(() => {
                                  const selectedCrypto = paymentMethods?.crypto_details?.find(c => c.symbol === depositCurrency);
                                  return selectedCrypto?.logo ? (
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                      <img
                                        src={selectedCrypto.logo}
                                        alt={selectedCrypto.name}
                                        className="w-full h-full object-contain p-1"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            const fallback = document.createElement('span');
                                            fallback.className = 'text-lg';
                                            fallback.textContent = getCurrencyIcon(depositCurrency);
                                            parent.appendChild(fallback);
                                          }
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                      {getCurrencyIcon(depositCurrency)}
                                    </div>
                                  );
                                })()}
                                <span className={`text-sm font-semibold ${depositCurrency ? '' : 'opacity-50'}`}>
                                  {depositCurrency || 'Select currency'}
                                </span>
                              </div>
                              <motion.div
                                animate={{ rotate: showDepositDropdown ? 180 : 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="flex-shrink-0"
                              >
                                <X className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-200 ${showDepositDropdown ? 'rotate-45' : ''}`} />
                              </motion.div>
                            </button>

                            {/* Currency Picker - Dropdown */}
                            <AnimatePresence>
                              {showDepositDropdown && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.15, ease: 'easeOut' }}
                                  className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-lg overflow-hidden ${theme === 'dark'
                                    ? 'bg-gray-950 border-gray-800'
                                    : 'bg-white border-gray-200 shadow-gray-900/10'
                                    }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Currency Options - Square Grid Layout */}
                                  <div className="p-3">
                                    <div className="grid grid-cols-3 gap-2.5">
                                      {paymentMethods?.crypto_details?.map((crypto) => {
                                        const isSelected = depositCurrency === crypto.symbol;

                                        return (
                                          <motion.button
                                            key={crypto.symbol}
                                            type="button"
                                            onClick={() => {
                                              setDepositCurrency(crypto.symbol as CryptoCurrency);
                                              setShowDepositDropdown(false);
                                            }}
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.92 }}
                                            transition={{
                                              type: "spring",
                                              stiffness: 400,
                                              damping: 20,
                                              scale: { duration: 0.1 }
                                            }}
                                            className={`relative aspect-square rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-2 ${isSelected
                                              ? theme === 'dark'
                                                ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                                                : 'bg-gray-900 text-white shadow-lg ring-2 ring-gray-900/50'
                                              : theme === 'dark'
                                                ? 'bg-gray-900/50 hover:bg-gray-800/70 text-white border border-gray-800'
                                                : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                                              }`}
                                          >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 overflow-hidden ${isSelected
                                              ? theme === 'dark' ? 'bg-black/10' : 'bg-white/20'
                                              : theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                              }`}>
                                              {crypto.logo ? (
                                                <img
                                                  src={crypto.logo}
                                                  alt={crypto.name}
                                                  className="w-full h-full object-contain p-1"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                      const fallback = document.createElement('span');
                                                      fallback.className = 'text-lg';
                                                      fallback.textContent = getCurrencyIcon(crypto.symbol as CryptoCurrency);
                                                      parent.appendChild(fallback);
                                                    }
                                                  }}
                                                />
                                              ) : (
                                                <span className="text-lg">{getCurrencyIcon(crypto.symbol as CryptoCurrency)}</span>
                                              )}
                                            </div>
                                            <span className="text-xs font-bold whitespace-nowrap">{crypto.symbol}</span>
                                            {isSelected && (
                                              <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                                className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
                                                  }`}
                                              >
                                                <Check className="w-3 h-3" />
                                              </motion.div>
                                            )}
                                          </motion.button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex gap-3">
                        <motion.button
                          onClick={() => {
                            setShowDepositModal(false);
                            setSelectedPackage(null);
                            setGooglePayAmount('');
                            setDepositAmount('');
                            setDepositStep('payment_method');
                            setDefaultPaymentMethod();
                            setShowPaymentMethodDropdown(false);
                            setShowGooglePayProviderDropdown(false);
                            // Reset Google Pay states
                            setSelectedGooglePayProvider(null);
                            setGooglePayReady(false);
                            setIsGooglePayLoading(false);
                            setIsGooglePayProcessing(false);
                            if (googlePayButtonRef.current) {
                              googlePayButtonRef.current.innerHTML = '';
                            }
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border-2 ${theme === 'dark'
                            ? 'bg-transparent border-gray-700 text-white hover:bg-gray-900/50'
                            : 'bg-transparent border-gray-300 text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          {t('auth.back') || 'Back'}
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            if (depositPaymentMethod === 'google_pay' && paymentMethods?.is_google_pay_enabled) {
                              // Google Pay için paket seçimine git
                              setDepositStep('package');
                            } else if ((depositPaymentMethod === 'iban' && paymentMethods?.is_iban_enabled) ||
                              (depositPaymentMethod === 'crypto' && paymentMethods?.is_crypto_enabled)) {
                              // IBAN/Crypto için direkt ödeme ekranına git
                              setDepositStep('payment_screen');
                            }
                          }}
                          disabled={!depositPaymentMethod ||
                            (depositPaymentMethod === 'google_pay' && !paymentMethods?.is_google_pay_enabled) ||
                            (depositPaymentMethod === 'iban' && (!paymentMethods?.is_iban_enabled || !selectedIban)) ||
                            (depositPaymentMethod === 'crypto' && (!paymentMethods?.is_crypto_enabled || !depositCurrency))}
                          whileHover={depositPaymentMethod &&
                            ((depositPaymentMethod === 'google_pay' && paymentMethods?.is_google_pay_enabled) ||
                              (depositPaymentMethod === 'iban' && paymentMethods?.is_iban_enabled && selectedIban) ||
                              (depositPaymentMethod === 'crypto' && paymentMethods?.is_crypto_enabled && depositCurrency)) ? { scale: 1.02 } : {}}
                          whileTap={depositPaymentMethod &&
                            ((depositPaymentMethod === 'google_pay' && paymentMethods?.is_google_pay_enabled) ||
                              (depositPaymentMethod === 'iban' && paymentMethods?.is_iban_enabled && selectedIban) ||
                              (depositPaymentMethod === 'crypto' && paymentMethods?.is_crypto_enabled && depositCurrency)) ? { scale: 0.98 } : {}}
                          className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${!depositPaymentMethod ||
                            (depositPaymentMethod === 'google_pay' && !paymentMethods?.is_google_pay_enabled) ||
                            (depositPaymentMethod === 'iban' && (!paymentMethods?.is_iban_enabled || !selectedIban)) ||
                            (depositPaymentMethod === 'crypto' && (!paymentMethods?.is_crypto_enabled || !depositCurrency))
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-white text-black hover:bg-gray-200'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                        >
                          {t('wallet.continue') || 'Continue'}
                          <ArrowLeft className="w-4 h-4 rotate-180" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Package Selection (Only for Google Pay) */}
                  {depositStep === 'package' && depositPaymentMethod === 'google_pay' && (
                    <motion.div
                      key="package-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Package Selection */}
                      <div>
                        <label className={`flex items-center gap-1.5 mb-2 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>
                          <Wallet className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold tracking-tight">{t('wallet.select_package') || 'Select Package'} *</span>
                        </label>
                        <div className="relative" ref={packageDropdownRef}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPackageDropdown(!showPackageDropdown);
                            }}
                            className={`w-full px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:outline-none focus:ring-1 font-medium text-left flex items-center justify-between ${theme === 'dark'
                              ? 'bg-gray-900/50 border-gray-800 text-white focus:border-gray-700 focus:ring-gray-800/50 hover:border-gray-700'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400 focus:ring-gray-300/40 hover:border-gray-400'
                              }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                }`}>
                                {selectedPackage?.logo ? (
                                  <img
                                    src={selectedPackage.logo}
                                    alt={selectedPackage.name[i18n.language as 'en' | 'tr'] || selectedPackage.name.en}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        const fallback = document.createElement('span');
                                        fallback.className = 'text-lg';
                                        fallback.textContent = '📦';
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-lg">📦</span>
                                )}
                              </div>
                              <div className="flex flex-col items-start min-w-0 flex-1">
                                <span className={`text-sm font-semibold ${selectedPackage ? '' : 'opacity-50'}`}>
                                  {selectedPackage ? (selectedPackage.name[i18n.language as 'en' | 'tr'] || selectedPackage.name.en) : (t('wallet.select_package') || 'Select package')}
                                </span>
                                {selectedPackage && (
                                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    ${selectedPackage.priceUSD} USD
                                  </span>
                                )}
                              </div>
                            </div>
                            <motion.div
                              animate={{ rotate: showPackageDropdown ? 180 : 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="flex-shrink-0"
                            >
                              <X className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-200 ${showPackageDropdown ? 'rotate-45' : ''}`} />
                            </motion.div>
                          </button>

                          {/* Package Picker - Dropdown */}
                          <AnimatePresence>
                            {showPackageDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-lg overflow-hidden ${theme === 'dark'
                                  ? 'bg-gray-950 border-gray-800'
                                  : 'bg-white border-gray-200 shadow-gray-900/10'
                                  }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Package Options - Square Grid Layout with Scroll */}
                                <div className="p-2 max-h-[400px] overflow-y-auto">
                                  <div className="grid grid-cols-4 gap-2">
                                    {packages.map((pkg) => {
                                      const currentLang = i18n.language as 'en' | 'tr';
                                      const pkgName = pkg.name[currentLang] || pkg.name.en;
                                      const isSelected = selectedPackage?.id === pkg.id;

                                      return (
                                        <motion.button
                                          key={pkg.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedPackage(pkg);
                                            setGooglePayAmount(pkg.priceUSD.toString());
                                            setShowPackageDropdown(false);
                                          }}
                                          whileHover={{ scale: 1.05, y: -2 }}
                                          whileTap={{ scale: 0.92 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 20,
                                            scale: { duration: 0.1 }
                                          }}
                                          className={`relative aspect-square rounded-lg transition-all duration-150 flex flex-col items-center justify-center gap-1.5 ${isSelected
                                            ? theme === 'dark'
                                              ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                                              : 'bg-gray-900 text-white shadow-lg ring-2 ring-gray-900/50'
                                            : theme === 'dark'
                                              ? 'bg-gray-900/50 hover:bg-gray-800/70 text-white border border-gray-800'
                                              : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                                            }`}
                                        >
                                          <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden ${isSelected
                                            ? theme === 'dark' ? 'bg-black/10' : 'bg-white/20'
                                            : theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                            }`}>
                                            {pkg.logo ? (
                                              <img
                                                src={pkg.logo}
                                                alt={pkgName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  // Fallback to emoji if image fails to load
                                                  const target = e.target as HTMLImageElement;
                                                  target.style.display = 'none';
                                                  const parent = target.parentElement;
                                                  if (parent) {
                                                    const fallback = document.createElement('span');
                                                    fallback.className = 'text-2xl';
                                                    fallback.textContent = getPackageIcon(pkgName);
                                                    parent.appendChild(fallback);
                                                  }
                                                }}
                                              />
                                            ) : (
                                              <span className="text-2xl">{getPackageIcon(pkgName)}</span>
                                            )}
                                          </div>
                                          <div className="flex flex-col items-center gap-0.5 px-1">
                                            <span className="text-[10px] font-bold leading-tight text-center line-clamp-2">{pkgName}</span>
                                            <span className={`text-[10px] font-semibold ${isSelected
                                              ? theme === 'dark' ? 'text-black/80' : 'text-white/80'
                                              : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                              }`}>
                                              ${pkg.priceUSD}
                                            </span>
                                          </div>
                                          {isSelected && (
                                            <motion.div
                                              initial={{ scale: 0, rotate: -180 }}
                                              animate={{ scale: 1, rotate: 0 }}
                                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                              className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
                                                }`}
                                            >
                                              <Check className="w-2.5 h-2.5" />
                                            </motion.div>
                                          )}
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Google Pay Provider Selection - Show when Google Pay payment method is selected and enabled */}
                      {depositPaymentMethod === 'google_pay' && paymentMethods?.is_google_pay_enabled && (
                        <div>
                          <label className={`flex items-center gap-1.5 mb-2 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>
                            <Wallet className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold tracking-tight">{t('wallet.select_provider') || 'Select Provider'} *</span>
                          </label>
                          <div className="relative" ref={googlePayProviderDropdownRef}>
                            <button
                              type="button"
                              onClick={() => {
                                if (depositPaymentMethod === 'google_pay' && selectedPackage) {
                                  setShowGooglePayProviderDropdown(!showGooglePayProviderDropdown);
                                }
                              }}
                              disabled={depositPaymentMethod !== 'google_pay' || !selectedPackage}
                              className={`w-full px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:outline-none focus:ring-1 font-medium text-left flex items-center justify-between ${depositPaymentMethod !== 'google_pay' || !selectedPackage
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                                } ${theme === 'dark'
                                  ? 'bg-gray-900/50 border-gray-800 text-white focus:border-gray-700 focus:ring-gray-800/50 hover:border-gray-700'
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400 focus:ring-gray-300/40 hover:border-gray-400'
                                }`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {selectedGooglePayProvider ? (
                                  <>
                                    {selectedGooglePayProvider.provider?.logo ? (
                                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                        <img
                                          src={selectedGooglePayProvider.provider.logo}
                                          alt={selectedGooglePayProvider.provider.name}
                                          className="w-full h-full object-contain p-1"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                              const fallback = document.createElement('span');
                                              fallback.className = 'text-lg';
                                              fallback.textContent = '💳';
                                              parent.appendChild(fallback);
                                            }
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                        <span>💳</span>
                                      </div>
                                    )}
                                    <div className="flex flex-col items-start min-w-0 flex-1">
                                      <span className={`text-sm font-semibold`}>
                                        {selectedGooglePayProvider.provider?.name || selectedGooglePayProvider.name || 'Provider'}
                                      </span>
                                      <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {selectedGooglePayProvider.environment}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                                      <span>💳</span>
                                    </div>
                                    <span className={`text-sm font-semibold opacity-50`}>
                                      {t('wallet.select_provider') || 'Select provider'}
                                    </span>
                                  </>
                                )}
                              </div>
                              <motion.div
                                animate={{ rotate: showGooglePayProviderDropdown ? 180 : 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="flex-shrink-0"
                              >
                                <X className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-200 ${showGooglePayProviderDropdown ? 'rotate-45' : ''}`} />
                              </motion.div>
                            </button>

                            {/* Google Pay Provider Picker - Dropdown */}
                            <AnimatePresence>
                              {showGooglePayProviderDropdown && selectedPackage && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.15, ease: 'easeOut' }}
                                  className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-lg overflow-hidden ${theme === 'dark'
                                    ? 'bg-gray-950 border-gray-800'
                                    : 'bg-white border-gray-200 shadow-gray-900/10'
                                    }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="p-3 max-h-[400px] overflow-y-auto">
                                    <div className="grid grid-cols-2 gap-2.5">
                                      {paymentMethods?.google_pay_details?.map((googlePayDetail, index) => {
                                        const isSelected = selectedGooglePayProvider?.merchant_id === googlePayDetail.merchant_id &&
                                          selectedGooglePayProvider?.environment === googlePayDetail.environment;
                                        return (
                                          <motion.button
                                            key={`${googlePayDetail.merchant_id}-${googlePayDetail.environment}-${index}`}
                                            type="button"
                                            onClick={() => {
                                              setSelectedGooglePayProvider(googlePayDetail);
                                              setShowGooglePayProviderDropdown(false);
                                            }}
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.92 }}
                                            transition={{
                                              type: "spring",
                                              stiffness: 400,
                                              damping: 20,
                                              scale: { duration: 0.1 }
                                            }}
                                            className={`relative aspect-square rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-2 ${isSelected
                                              ? theme === 'dark'
                                                ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                                                : 'bg-gray-900 text-white shadow-lg ring-2 ring-gray-900/50'
                                              : theme === 'dark'
                                                ? 'bg-gray-900/50 hover:bg-gray-800/70 text-white border border-gray-800'
                                                : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                                              }`}
                                          >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 overflow-hidden ${isSelected
                                              ? theme === 'dark' ? 'bg-black/10' : 'bg-white/20'
                                              : theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                              }`}>
                                              {googlePayDetail.provider?.logo ? (
                                                <img
                                                  src={googlePayDetail.provider.logo}
                                                  alt={googlePayDetail.provider.name}
                                                  className="w-full h-full object-contain p-1"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                      const fallback = document.createElement('span');
                                                      fallback.className = 'text-lg';
                                                      fallback.textContent = '💳';
                                                      parent.appendChild(fallback);
                                                    }
                                                  }}
                                                />
                                              ) : (
                                                <span className="text-lg">💳</span>
                                              )}
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5 px-1">
                                              <span className="text-xs font-bold leading-tight text-center line-clamp-2">{googlePayDetail.provider?.name || googlePayDetail.name || 'Provider'}</span>
                                              <span className={`text-[10px] font-semibold ${isSelected
                                                ? theme === 'dark' ? 'text-black/80' : 'text-white/80'
                                                : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                }`}>
                                                {googlePayDetail.environment}
                                              </span>
                                            </div>
                                            {isSelected && (
                                              <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                                className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
                                                  }`}
                                              >
                                                <Check className="w-3 h-3" />
                                              </motion.div>
                                            )}
                                          </motion.button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex gap-3">
                        <motion.button
                          onClick={() => {
                            setDepositStep('payment_method');
                            setSelectedPackage(null);
                            setGooglePayAmount('');
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border-2 ${theme === 'dark'
                            ? 'bg-transparent border-gray-700 text-white hover:bg-gray-900/50'
                            : 'bg-transparent border-gray-300 text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          {t('auth.back') || 'Back'}
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            if (selectedPackage && selectedGooglePayProvider) {
                              setDepositStep('payment_screen');
                            }
                          }}
                          disabled={!selectedPackage || !selectedGooglePayProvider}
                          whileHover={selectedPackage && selectedGooglePayProvider ? { scale: 1.02 } : {}}
                          whileTap={selectedPackage && selectedGooglePayProvider ? { scale: 0.98 } : {}}
                          className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${!selectedPackage || !selectedGooglePayProvider
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'bg-white text-black hover:bg-gray-200'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                        >
                          {t('wallet.continue') || 'Continue'}
                          <ArrowLeft className="w-4 h-4 rotate-180" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Payment Screen with Summary */}
                  {depositStep === 'payment_screen' && (
                    <motion.div
                      key="payment-screen-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Summary Section - Only for Google Pay */}
                      {depositPaymentMethod === 'google_pay' && (
                        <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('wallet.summary') || 'Summary'}
                          </h4>

                          <div className={`flex flex-col gap-2 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                            {/* Package Info - Only for Google Pay */}
                            {selectedPackage && (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('wallet.package') || 'Package'}
                                  </span>
                                  <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedPackage.name[i18n.language as 'en' | 'tr'] || selectedPackage.name.en}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('wallet.price') || 'Price'}
                                  </span>
                                  <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    ${selectedPackage.priceUSD} USD
                                  </span>
                                </div>
                              </>
                            )}

                            {/* Payment Method Info */}
                            <div className={`rounded-lg`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {t('wallet.payment_method') || 'Payment Method'}
                                </span>
                                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {t('wallet.google_pay') || 'Google Pay'}
                                </span>
                              </div>
                            </div>

                            {/* Provider Info - Only for Google Pay */}
                            {selectedGooglePayProvider && (
                              <div className={`rounded-lg`}>
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('wallet.provider') || 'Provider'}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {selectedGooglePayProvider.provider?.logo && (
                                      <img
                                        src={selectedGooglePayProvider.provider.logo}
                                        alt={selectedGooglePayProvider.provider.name}
                                        className="w-4 h-4 object-contain"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                      {selectedGooglePayProvider.provider?.name || 'Provider'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('wallet.environment') || 'Environment'}
                                  </span>
                                  <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {selectedGooglePayProvider.environment}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Deposit Address - Only for Crypto */}
                      {depositPaymentMethod === 'crypto' && (
                        <>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {t('wallet.deposit_address') || 'Deposit Address'}
                            </label>
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                              <code className={`text-xs font-mono flex-1 truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                {getDepositAddress()}
                              </code>
                              <button
                                onClick={() => copyToClipboard(getDepositAddress(), 'deposit')}
                                className={`p-2 rounded-lg transition-all ${theme === 'dark'
                                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                                  : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                                  }`}
                              >
                                {copiedAddress === 'deposit' ? (
                                  <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {t('wallet.qr_code') || 'QR Code'}
                                </h4>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {t('wallet.qr_code_hint') || 'Scan to copy the address instantly.'}
                                </p>
                              </div>
                              <div className={`text-xs font-semibold px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'}`}>
                                {depositCurrency}
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                              <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gray-950' : 'bg-white'} shadow-inner`}>
                                <QRCodeSVG
                                  value={getDepositAddress()}
                                  size={160}
                                  bgColor={theme === 'dark' ? '#0f172a' : '#ffffff'}
                                  fgColor={theme === 'dark' ? '#ffffff' : '#0f172a'}
                                />
                              </div>
                              <p className={`text-[11px] text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('wallet.qr_code_note') || 'Show this code to send crypto quickly.'}
                              </p>
                            </div>
                          </div>

                          <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'}`}>
                            <p className={`text-xs ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}`}>
                              {depositCurrency
                                ? (t('wallet.deposit_warning', { currency: depositCurrency }) || `Only send ${depositCurrency} to this address. Sending other cryptocurrencies may result in permanent loss.`)
                                : 'Only send the selected cryptocurrency to this address. Sending other cryptocurrencies may result in permanent loss.'}
                            </p>
                          </div>
                        </>
                      )}

                      {/* IBAN Details - Only for IBAN */}
                      {depositPaymentMethod === 'iban' && selectedIban && (
                        <>
                          {/* Bank Name & Account Holder - Grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('wallet.bank_name') || 'Bank Name'}
                              </label>
                              <div className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {selectedIban.bank_name}
                                </p>
                              </div>
                            </div>
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('wallet.account_holder') || 'Account Holder'}
                              </label>
                              <div className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {selectedIban.account_holder}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* IBAN */}
                          <div>
                            <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {t('wallet.iban') || 'IBAN'}
                            </label>
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                              <code className={`text-xs font-mono flex-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                {selectedIban.iban}
                              </code>
                              <button
                                onClick={() => copyToClipboard(selectedIban.iban, 'iban')}
                                className={`p-1.5 rounded-lg transition-all ${theme === 'dark'
                                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                                  : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                                  }`}
                              >
                                {copiedAddress === 'iban' ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Swift/BIC & Reference Number - Grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('wallet.swift_bic') || 'SWIFT / BIC'}
                              </label>
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <code className={`text-xs font-mono flex-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {selectedIban.swift_bic}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(selectedIban.swift_bic, 'swift')}
                                  className={`p-1.5 rounded-lg transition-all ${theme === 'dark'
                                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                  {copiedAddress === 'swift' ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('wallet.reference_number') || 'Reference'}
                              </label>
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <code className={`text-xs font-mono flex-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  CV-{user?.public_id || ''}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(`BIF-${user?.public_id || ''}`, 'reference')}
                                  className={`p-1.5 rounded-lg transition-all ${theme === 'dark'
                                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                  {copiedAddress === 'reference' ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Branch Name & Currency - Grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('wallet.branch_name') || 'Branch'}
                              </label>
                              <div className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {selectedIban.branch_name}
                                </p>
                              </div>
                            </div>
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('wallet.currency') || 'Currency'}
                              </label>
                              <div className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {selectedIban.currency}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* IBAN QR Code */}
                          <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {t('wallet.qr_code') || 'QR Code'}
                                </h4>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {t('wallet.qr_code_hint') || 'Scan to copy the address instantly.'}
                                </p>
                              </div>
                              <div className={`text-xs font-semibold px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'}`}>
                                {selectedIban.currency}
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                              <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-gray-950' : 'bg-white'} shadow-inner`}>
                                <QRCodeSVG
                                  value={selectedIban.iban}
                                  size={160}
                                  bgColor={theme === 'dark' ? '#0f172a' : '#ffffff'}
                                  fgColor={theme === 'dark' ? '#ffffff' : '#0f172a'}
                                  includeMargin
                                />
                              </div>
                              <p className={`text-[11px] text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('wallet.qr_code_note') || 'Show this code to send crypto quickly.'}
                              </p>
                            </div>
                          </div>

                          {/* Info Message */}
                          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                              {t('wallet.iban_info') || 'Please include your reference number in the transfer description. Transfers usually take 1-3 business days.'}
                            </p>
                          </div>
                        </>
                      )}

                      {/* Navigation Buttons - Common for all payment methods except Google Pay */}
                      {depositPaymentMethod !== 'google_pay' && (
                        <div className="flex gap-3">
                          <motion.button
                            onClick={() => {
                              setDepositStep('payment_method');
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border-2 ${theme === 'dark'
                              ? 'bg-transparent border-gray-700 text-white hover:bg-gray-900/50'
                              : 'bg-transparent border-gray-300 text-gray-900 hover:bg-gray-50'
                              }`}
                          >
                            <ArrowLeft className="w-4 h-4" />
                            {t('auth.back') || 'Back'}
                          </motion.button>
                          <motion.button
                            onClick={async () => {
                              setIsProcessing(true);
                              try {
                                // TODO: Implement deposit logic
                                if (depositPaymentMethod === 'iban') {
                                  // await api.depositIBAN(selectedIban);
                                } else if (depositPaymentMethod === 'crypto') {
                                  // await api.deposit(depositCurrency);
                                }

                                // Simulate API call
                                await new Promise(resolve => setTimeout(resolve, 1500));

                                setIsProcessing(false);
                                setDepositStep('success');
                              } catch (error) {
                                console.error('Deposit failed:', error);
                                setIsProcessing(false);
                                setDepositStep('error');
                              }
                            }}
                            disabled={isProcessing ||
                              (depositPaymentMethod === 'iban' && !selectedIban) ||
                              (depositPaymentMethod === 'crypto' && !depositCurrency)}
                            whileHover={!isProcessing &&
                              ((depositPaymentMethod === 'iban' && selectedIban) ||
                                (depositPaymentMethod === 'crypto' && depositCurrency)) ? { scale: 1.02 } : {}}
                            whileTap={!isProcessing &&
                              ((depositPaymentMethod === 'iban' && selectedIban) ||
                                (depositPaymentMethod === 'crypto' && depositCurrency)) ? { scale: 0.98 } : {}}
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isProcessing ||
                              (depositPaymentMethod === 'iban' && !selectedIban) ||
                              (depositPaymentMethod === 'crypto' && !depositCurrency)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : theme === 'dark'
                                ? 'bg-white text-black hover:bg-gray-200'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                              }`}
                          >
                            {isProcessing ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                <span>{t('wallet.processing') || 'Processing...'}</span>
                              </>
                            ) : (
                              <span>{t('wallet.confirm_deposit') || 'Confirm Deposit'}</span>
                            )}
                          </motion.button>
                        </div>
                      )}

                      {/* Google Pay Section */}
                      {depositPaymentMethod === 'google_pay' && (
                        <motion.div
                          key="google_pay"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${theme === 'dark' ? 'bg-white' : 'bg-gray-900'}`}>
                                {paymentMethods?.google_pay_details?.[0]?.logo ? (
                                  <img
                                    src={paymentMethods.google_pay_details[0].logo}
                                    alt="Google Pay"
                                    className="w-full h-full object-contain p-2"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        const fallback = document.createElement('span');
                                        fallback.className = 'text-2xl font-bold';
                                        fallback.textContent = 'G';
                                        fallback.style.color = theme === 'dark' ? 'black' : 'white';
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-black' : 'text-white'}`}>G</span>
                                )}
                              </div>
                              <div>
                                <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {t('wallet.google_pay') || 'Google Pay'}
                                </h4>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {t('wallet.fast_secure_payments') || 'Fast and secure payments'}
                                </p>
                              </div>
                            </div>
                            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {t('wallet.google_pay_info') || 'Use your Google Pay account to make instant deposits. Payments are processed securely and appear in your wallet immediately.'}
                              </p>
                            </div>
                          </div>

                          {/* Package Amount Display */}
                          {selectedPackage && (
                            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {t('wallet.package_amount') || 'Package Amount'}
                                </span>
                                <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  ${selectedPackage.priceUSD} USD
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Google Pay Button Container */}
                          <div className="w-full space-y-3">
                            {isGooglePayLoading ? (
                              // Loading State
                              <div className={`w-full px-4 py-3 rounded-xl flex items-center justify-center gap-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <div className={`w-5 h-5 border-2 ${theme === 'dark' ? 'border-white/30' : 'border-gray-400/30'} border-t-current rounded-full animate-spin ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`} />
                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {t('wallet.google_pay_loading') || 'Loading Google Pay...'}
                                </span>
                              </div>
                            ) : googlePayReady && googlePayAmount && parseFloat(googlePayAmount) > 0 ? (
                              // Google Pay Button (when ready)
                              <div ref={googlePayButtonRef} className="w-full min-h-[48px]" />
                            ) : (
                              // Fallback Button (when Google Pay is not available)
                              <motion.button
                                type="button"
                                onClick={async () => {
                                  if (!googlePayAmount || parseFloat(googlePayAmount) <= 0) {
                                    return;
                                  }

                                  setIsGooglePayProcessing(true);

                                  // Simulate payment processing
                                  try {
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                    setIsGooglePayProcessing(false);
                                    setDepositStep('success');
                                  } catch (error) {
                                    console.error('Payment failed:', error);
                                    setIsGooglePayProcessing(false);
                                    setDepositStep('error');
                                  }
                                }}
                                disabled={!googlePayAmount || isGooglePayProcessing}
                                whileHover={!googlePayAmount || isGooglePayProcessing ? {} : { scale: 1.02 }}
                                whileTap={!googlePayAmount || isGooglePayProcessing ? {} : { scale: 0.98 }}
                                className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${!googlePayAmount || isGooglePayProcessing
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : theme === 'dark'
                                    ? 'bg-white text-black hover:bg-gray-200'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                  }`}
                              >
                                {isGooglePayProcessing ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>{t('wallet.processing') || 'Processing...'}</span>
                                  </>
                                ) : (
                                  <>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                                      {paymentMethods?.google_pay_details?.[0]?.logo ? (
                                        <img
                                          src={paymentMethods.google_pay_details[0].logo}
                                          alt="Google Pay"
                                          className="w-full h-full object-contain p-0.5"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                              const fallback = document.createElement('span');
                                              fallback.className = 'text-sm font-bold';
                                              fallback.textContent = 'G';
                                              fallback.style.color = theme === 'dark' ? 'white' : 'black';
                                              parent.appendChild(fallback);
                                            }
                                          }}
                                        />
                                      ) : (
                                        <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>G</span>
                                      )}
                                    </div>
                                    <span>{t('wallet.pay_with_google') || 'Pay with Google Pay'} {googlePayAmount ? `$${googlePayAmount}` : ''}</span>
                                  </>
                                )}
                              </motion.button>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex gap-3">
                              <motion.button
                                onClick={() => {
                                  if (depositPaymentMethod === 'google_pay') {
                                    setDepositStep('package');
                                  } else {
                                    setDepositStep('payment_method');
                                    setDepositAmount('');
                                  }
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border-2 ${theme === 'dark'
                                  ? 'bg-transparent border-gray-700 text-white hover:bg-gray-900/50'
                                  : 'bg-transparent border-gray-300 text-gray-900 hover:bg-gray-50'
                                  }`}
                              >
                                <ArrowLeft className="w-4 h-4" />
                                {t('auth.back') || 'Back'}
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 5: Success Screen */}
                  {depositStep === 'success' && (
                    <motion.div
                      key="success-step"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6 py-8"
                    >
                      <div className="flex flex-col items-center justify-center text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'
                            }`}
                        >
                          <CheckCircle className={`w-12 h-12 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </motion.div>
                        <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {depositPaymentMethod === 'google_pay'
                            ? (t('wallet.deposit_success') || 'Deposit Successful!')
                            : (t('wallet.deposit_received') || 'Deposit Received!')
                          }
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                          {depositPaymentMethod === 'google_pay'
                            ? (t('wallet.deposit_success_message') || 'Your deposit has been processed successfully. The funds will be available in your wallet shortly.')
                            : (t('wallet.deposit_pending_message') || 'Your deposit request has been received. The transaction will be completed shortly.')
                          }
                        </p>
                        {selectedPackage && (
                          <div className={`w-full p-4 rounded-xl mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('wallet.package') || 'Package'}
                              </span>
                              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {selectedPackage.name[i18n.language as 'en' | 'tr'] || selectedPackage.name.en}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('wallet.amount') || 'Amount'}
                              </span>
                              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                ${selectedPackage.priceUSD} USD
                              </span>
                            </div>
                          </div>
                        )}
                        <motion.button
                          onClick={() => {
                            setShowDepositModal(false);
                            setSelectedPackage(null);
                            setGooglePayAmount('');
                            setDepositStep('package');
                            setDefaultPaymentMethod();
                            // Reset Google Pay states
                            setGooglePayReady(false);
                            setIsGooglePayLoading(false);
                            setIsGooglePayProcessing(false);
                            if (googlePayButtonRef.current) {
                              googlePayButtonRef.current.innerHTML = '';
                            }
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${theme === 'dark'
                            ? 'bg-white text-black hover:bg-gray-200'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                        >
                          {t('wallet.close') || 'Close'}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 6: Error Screen */}
                  {depositStep === 'error' && (
                    <motion.div
                      key="error-step"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6 py-8"
                    >
                      <div className="flex flex-col items-center justify-center text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
                            }`}
                        >
                          <XCircle className={`w-12 h-12 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                        </motion.div>
                        <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {t('wallet.deposit_error') || 'Deposit Failed'}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                          {t('wallet.deposit_error_message') || 'Unfortunately, your deposit could not be processed. Please try again or contact support if the problem persists.'}
                        </p>
                        <div className="flex gap-3 w-full">
                          <motion.button
                            onClick={() => {
                              setDepositStep('payment_screen');
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border-2 ${theme === 'dark'
                              ? 'bg-transparent border-gray-700 text-white hover:bg-gray-900/50'
                              : 'bg-transparent border-gray-300 text-gray-900 hover:bg-gray-50'
                              }`}
                          >
                            <ArrowLeft className="w-4 h-4" />
                            {t('auth.back') || 'Back'}
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              setShowDepositModal(false);
                              setSelectedPackage(null);
                              setGooglePayAmount('');
                              setDepositStep('package');
                              setDefaultPaymentMethod();
                              setShowGooglePayProviderDropdown(false);
                              // Reset Google Pay states
                              setSelectedGooglePayProvider(null);
                              setGooglePayReady(false);
                              setIsGooglePayLoading(false);
                              setIsGooglePayProcessing(false);
                              if (googlePayButtonRef.current) {
                                googlePayButtonRef.current.innerHTML = '';
                              }
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${theme === 'dark'
                              ? 'bg-white text-black hover:bg-gray-200'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                              }`}
                          >
                            {t('wallet.close') || 'Close'}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowWithdrawModal(false)}
          >
            <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-md rounded-2xl ${theme === 'dark'
                ? 'bg-gray-900 border border-gray-800'
                : 'bg-white border border-gray-200'
                }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('wallet.withdraw') || 'Withdraw'}
                  </h3>
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  >
                    <ArrowLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Balance Display */}
                  {user?.balance !== undefined && (
                    <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {t('wallet.available_balance') || 'Available Balance'}
                        </span>
                        <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          ${(Number(user.balance) || 0).toFixed(2)} LGBT
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Currency Display (USDT Only) */}
                  <div>
                    <label className={`flex items-center gap-1.5 mb-2 ${theme === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>
                      <Wallet className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold tracking-tight">{t('wallet.currency') || 'Currency'}</span>
                    </label>
                    <div className={`w-full px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 flex items-center gap-2.5 ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-800 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                        }`}>
                        {getCurrencyIcon('LGBT')}
                      </div>
                      <span className="text-sm font-semibold">LGBT</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('wallet.amount') || 'Amount'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={withdrawAmount}
                        onChange={(e) => {
                          // Replace comma with dot for decimal separator
                          let value = e.target.value.replace(',', '.');
                          // Only allow numbers and one decimal point
                          value = value.replace(/[^0-9.]/g, '');
                          // Ensure only one decimal point
                          const parts = value.split('.');
                          if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                          }
                          setWithdrawAmount(value);
                        }}
                        placeholder="0.00"
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all ${theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-gray-600'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                          }`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {withdrawCurrency}
                        </span>
                      </div>
                    </div>
                    {/* Percentage Buttons */}
                    {user?.balance !== undefined && Number(user.balance) > 0 && (
                      <div className="flex gap-2 mt-2">
                        {[25, 50, 75, 100].map((percentage) => {
                          const amount = ((Number(user.balance) || 0) * percentage / 100).toFixed(2);
                          return (
                            <motion.button
                              key={percentage}
                              type="button"
                              onClick={() => setWithdrawAmount(amount)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${theme === 'dark'
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                }`}
                            >
                              %{percentage}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('wallet.withdraw_address') || 'Withdraw Address'}
                    </label>
                    <input
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder="0x..."
                      className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all font-mono text-sm ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-gray-600'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-900'
                        }`}
                    />
                  </div>

                  <motion.button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || !withdrawAddress || isProcessing}
                    whileHover={{ scale: !withdrawAmount || !withdrawAddress || isProcessing ? 1 : 1.02 }}
                    whileTap={{ scale: !withdrawAmount || !withdrawAddress || isProcessing ? 1 : 0.98 }}
                    className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${!withdrawAmount || !withdrawAddress || isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>{t('wallet.processing') || 'Processing...'}</span>
                      </>
                    ) : (
                      <span>{t('wallet.confirm_withdraw') || 'Confirm Withdraw'}</span>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (inline) {
    return <div className="h-full w-full">{content}</div>;
  }

  return (
    <Container>
      {content}
    </Container>
  );
};

export default WalletScreen;