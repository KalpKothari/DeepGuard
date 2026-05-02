import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'free' | 'premium';
  onUpdatePlan: (plan: 'free' | 'premium') => void;
}

const plans = [
  {
    id: 'free',
    name: 'Free Plan',
    price: '$0',
    period: 'Forever',
    description: 'Essential deepfake detection',
    features: [
      'Image detection only',
      'Basic confidence score',
      'Simple explanation',
      'Up to 10 scans/month',
      'No advanced analytics',
    ],
    // Solid light grey border for inactive
    color: 'border-slate-200 bg-white',
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: '$9.99',
    period: 'per month',
    description: 'Advanced forensic analysis',
    features: [
      'Image + Video detection',
      'Advanced analytics dashboard',
      'Feature-wise analysis',
      'Heatmap visualization',
      'Frame-by-frame video analysis',
      'Unlimited scans',
      'Priority support',
      '30-day money-back guarantee',
    ],
    // Subtle purple tint for the premium card background
    color: 'border-purple-200 bg-purple-50/50',
  },
];

export const SubscriptionModal = ({
  isOpen,
  onClose,
  currentPlan,
  onUpdatePlan,
}: SubscriptionModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>(currentPlan);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
  });

  const handleAutofillCard = () => {
    setPaymentData({
      cardNumber: '4532 1488 0343 6467',
      cardName: 'John Developer',
      expiryMonth: '12',
      expiryYear: '26',
      cvc: '123',
    });
    toast.success('Test card details auto-filled');
  };

  const handlePayment = async () => {
    if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.expiryMonth || !paymentData.expiryYear || !paymentData.cvc) {
      toast.error('Please fill in all payment details');
      return;
    }

    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setProcessing(false);
    
    toast.success('Payment successful! Welcome to Premium');
    onUpdatePlan('premium');
    setShowPayment(false);
    setSelectedPlan('premium');

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleDowngrade = () => {
    toast.success('Plan downgraded to Free');
    onUpdatePlan('free');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Added max-h-[90vh] overflow-y-auto for scrollability on small screens */}
      <DialogContent className="max-w-2xl border-slate-200 bg-white shadow-xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-slate-900">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 fill-purple-600/10" />
            Manage Your Plan
          </DialogTitle>
          <DialogClose />
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!showPayment ? (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stack on mobile, side-by-side on tablet/desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.map((plan) => {
                  // Dynamically assign badge based on current active plan
                  const badgeText = plan.id === currentPlan ? 'Current Plan' : (plan.id === 'premium' ? 'Most Popular' : null);

                  return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ translateY: -2 }}
                    className={`relative p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPlan === plan.id 
                        ? 'border-purple-600 bg-purple-50/30 shadow-sm' 
                        : `${plan.color} hover:border-slate-300`
                    }`}
                    onClick={() => setSelectedPlan(plan.id as 'free' | 'premium')}
                  >
                    {badgeText && (
                      <div className="absolute -top-3 -right-2">
                        <div className="px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          {badgeText}
                        </div>
                      </div>
                    )}

                    {selectedPlan === plan.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mb-4">{plan.description}</p>

                    <div className="mb-5 sm:mb-6">
                      <span className="text-2xl sm:text-3xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-xs text-slate-500 ml-1">{plan.period}</span>
                    </div>

                    <div className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          <span className="text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )})}
              </div>

              {/* Stack buttons on small mobile, side-by-side on larger screens */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-11 sm:h-10">
                  Cancel
                </Button>

                {selectedPlan === 'free' && currentPlan === 'premium' ? (
                  <Button onClick={handleDowngrade} variant="destructive" className="flex-1 rounded-xl h-11 sm:h-10">
                    Downgrade to Free
                  </Button>
                ) : selectedPlan === 'premium' && currentPlan === 'free' ? (
                  <Button
                    onClick={() => setShowPayment(true)}
                    className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 h-11 sm:h-10"
                  >
                    <Zap className="w-4 h-4 mr-2 fill-current" />
                    Upgrade to Premium
                  </Button>
                ) : (
                  <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl bg-slate-50 border-slate-200 text-slate-400 h-11 sm:h-10" disabled>
                    Current Plan
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Solid background for total bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-700">
                  <span className="font-bold text-slate-900">Order Total:</span> $9.99/month
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Cardholder Name
                  </label>
                  <Input
                    value={paymentData.cardName}
                    onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                    placeholder="John Doe"
                    className="rounded-xl border-slate-200 focus:border-purple-600 focus:ring-purple-600 h-11 sm:h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Card Number
                  </label>
                  <Input
                    value={paymentData.cardNumber}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\s/g, '');
                      val = val.replace(/(\d{4})/g, '$1 ').trim();
                      setPaymentData({ ...paymentData, cardNumber: val });
                    }}
                    placeholder="4532 1488 0343 6467"
                    maxLength={19}
                    className="rounded-xl border-slate-200 focus:border-purple-600 focus:ring-purple-600 h-11 sm:h-10"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Month</label>
                    <Input
                      value={paymentData.expiryMonth}
                      onChange={(e) => setPaymentData({ ...paymentData, expiryMonth: e.target.value })}
                      placeholder="12"
                      maxLength={2}
                      className="rounded-xl border-slate-200 focus:border-purple-600 h-11 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Year</label>
                    <Input
                      value={paymentData.expiryYear}
                      onChange={(e) => setPaymentData({ ...paymentData, expiryYear: e.target.value })}
                      placeholder="26"
                      maxLength={2}
                      className="rounded-xl border-slate-200 focus:border-purple-600 h-11 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">CVC</label>
                    <Input
                      value={paymentData.cvc}
                      onChange={(e) => setPaymentData({ ...paymentData, cvc: e.target.value })}
                      placeholder="123"
                      maxLength={3}
                      type="password"
                      className="rounded-xl border-slate-200 focus:border-purple-600 h-11 sm:h-10"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAutofillCard}
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-lg text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-10"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Auto-fill Test Card
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-500 text-center">
                  🔒 Your payment information is encrypted and secure.
                </p>
              </div>

              {/* Stack buttons vertically on very small screens, side-by-side on sm+ */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button
                  onClick={() => setShowPayment(false)}
                  variant="outline"
                  className="flex-1 rounded-xl border-slate-200 text-slate-600 h-11 sm:h-10"
                  disabled={processing}
                >
                  Back
                </Button>
                <Button
                  onClick={handlePayment}
                  className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-100 h-11 sm:h-10"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Complete Payment
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;