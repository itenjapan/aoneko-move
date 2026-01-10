import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, LatLng, DeliveryStatus } from '../../types/Order';
import { User } from '../../types/User';
import { mockStore } from '../../services/mockDb';
import { Send, X, User as UserIcon, Truck, ShieldAlert, MapPin, Calculator, Loader2 } from 'lucide-react';
import { AddressAutocompleteInput } from '../OrderForm';
import { getDistance } from '../../services/googleMaps/distance';
import { calculateCompleteBreakdown } from '../../utils/pricingFormulas';
import DeliveryMap from '../Route/DeliveryMap';
import { generateRoute } from '../../services/liveTrackingService';

interface ChatInterfaceProps {
  deliveryId?: string;
  currentUser: User;
  recipientName?: string;
  onClose: () => void;
  isAssistantMode?: boolean; // Nueva prop para activar el modo cotizador
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ deliveryId, currentUser, recipientName, onClose, isAssistantMode = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // States para el flujo de cotización interna del chat
  const [quoteStep, setQuoteStep] = useState<'idle' | 'origin' | 'destination' | 'calculating' | 'result'>('idle');
  const [quoteData, setQuoteData] = useState<{ origin?: string, dest?: string, originLatLng?: LatLng, destLatLng?: LatLng, result?: any }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (deliveryId) {
      const fetchMessages = () => setMessages(mockStore.getMessages(deliveryId));
      fetchMessages();
      const interval = setInterval(fetchMessages, 2000);
      return () => clearInterval(interval);
    } else if (isAssistantMode && messages.length === 0) {
      // Mensaje inicial del bot
      addBotMessage("こんにちは！Aoneko Assistantです。配送のお見積もりをお手伝いします。まず、集荷先の住所を教えていただけますか？");
      setQuoteStep('origin');
    }
  }, [deliveryId, isAssistantMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, quoteStep]);

  const addBotMessage = (text: string) => {
    const botMsg: ChatMessage = {
      id: Date.now().toString(),
      deliveryId: deliveryId || 'assistant',
      senderId: 'bot',
      senderName: 'Aoneko Bot',
      senderRole: 'admin',
      text,
      timestamp: new Date().toISOString(),
      isRead: true
    };
    setMessages(prev => [...prev, botMsg]);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (deliveryId) {
      mockStore.sendMessage(deliveryId, currentUser.id, inputText.trim());
      setMessages(mockStore.getMessages(deliveryId));
    } else {
      // En modo asistente, simplemente añadimos el mensaje visualmente
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        deliveryId: 'assistant',
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: 'customer',
        text: inputText,
        timestamp: new Date().toISOString(),
        isRead: true
      };
      setMessages(prev => [...prev, userMsg]);
    }
    setInputText('');
  };

  const processQuote = async (origin: string, dest: string, oLatLng: LatLng, dLatLng: LatLng) => {
    setQuoteStep('calculating');
    setIsTyping(true);
    try {
      // Use the new modular services instead of the removed PricingService
      const { distanceKm } = await getDistance(origin, dest);

      const breakdown = calculateCompleteBreakdown(
        { base_price: 1580 }, // Default keivan base price
        distanceKm,
        0, // toll
        0, // loading
        0  // custom
      );

      const result = {
        estimatedDistance: parseFloat(distanceKm.toFixed(1)),
        totalPrice: breakdown.total_customer_price
      };

      setQuoteData(prev => ({ ...prev, result }));
      addBotMessage(`お見積もりが完了しました！\n距離: ${result.estimatedDistance}km\n推定料金: ¥${result.totalPrice.toLocaleString()}`);
      setQuoteStep('result');
    } catch (err) {
      addBotMessage("申し訳ありません。お見積もりの計算中にエラーが発生しました。");
      setQuoteStep('idle');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col h-[650px] border border-slate-100">

        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center ring-2 ring-brand-400">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{isAssistantMode ? 'Aoneko Assistant' : recipientName}</h3>
              <p className="text-[10px] text-brand-300 font-bold tracking-widest uppercase">AI Service</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.senderId === currentUser.id ? 'bg-brand-500 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[9px] text-right mt-1 opacity-50`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}

          {/* Input de dirección dinámico dentro del chat */}
          {quoteStep === 'origin' && (
            <div className="bg-white p-4 rounded-2xl border-2 border-brand-100 animate-fade-in-up shadow-md">
              <AddressAutocompleteInput
                label="集荷先を選択"
                value={quoteData.origin || ''}
                onChange={(val) => setQuoteData(p => ({ ...p, origin: val }))}
                onSelectLatLng={(ll) => {
                  setQuoteData(p => ({ ...p, originLatLng: ll }));
                  addBotMessage(`${quoteData.origin} ですね。次に、配送先の住所を教えてください。`);
                  setQuoteStep('destination');
                }}
              />
            </div>
          )}

          {quoteStep === 'destination' && (
            <div className="bg-white p-4 rounded-2xl border-2 border-brand-100 animate-fade-in-up shadow-md">
              <AddressAutocompleteInput
                label="配送先を選択"
                value={quoteData.dest || ''}
                onChange={(val) => setQuoteData(p => ({ ...p, dest: val }))}
                onSelectLatLng={(ll) => {
                  setQuoteData(p => ({ ...p, destLatLng: ll }));
                  if (quoteData.origin && quoteData.originLatLng) {
                    processQuote(quoteData.origin, quoteData.dest!, quoteData.originLatLng, ll);
                  }
                }}
              />
            </div>
          )}

          {quoteStep === 'result' && quoteData.result && (
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-lg animate-fade-in-up">
              <DeliveryMap
                pickupLatLng={quoteData.originLatLng!}
                deliveryLatLng={quoteData.destLatLng!}
                currentStatus="pending"
                estimatedRoute={generateRoute(quoteData.originLatLng!, quoteData.destLatLng!)}
              />
              <div className="p-4 bg-slate-900 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-brand-400">Total Quote</span>
                  <span className="text-2xl font-bold">¥{quoteData.result.totalPrice.toLocaleString()}</span>
                </div>
                <button onClick={() => window.location.href = '/quote'} className="w-full mt-3 bg-brand-500 py-2 rounded-xl font-bold text-sm hover:bg-brand-400 transition-all">予約手続きへ進む</button>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition-all"
          />
          <button type="submit" className="bg-slate-900 text-white p-3 rounded-xl hover:bg-brand-600 transition-colors shadow-sm"><Send size={20} /></button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;