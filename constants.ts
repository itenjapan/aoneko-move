import { Vehicle, Plan } from './types';

// Custom SVG Data URIs for consistent, simple line art (Blue & Black)
// Refined to look more like specific Japanese Kei vehicles (Boxy Van & Flatbed Truck)
// Added padding in viewBox (0 0 240 180) to make the drawing appear smaller/lighter

const KEI_VAN_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none">
  <!-- Road Line -->
  <path d="M200 140H40" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Body: Boxy "Kei" Shape -->
  <path d="M45 130H185C190.5 130 195 125.5 195 120V50C195 44.5 190.5 40 185 40H65C55 40 45 50 45 60V130Z" stroke="%231e293b" stroke-width="3" stroke-linejoin="round"/>
  
  <!-- Cabin / Door details -->
  <path d="M45 80H195" stroke="%231e293b" stroke-width="2"/>
  <path d="M85 40V130" stroke="%231e293b" stroke-width="2"/> <!-- Front Door Line -->
  <path d="M145 40V130" stroke="%23cbd5e1" stroke-width="2"/> <!-- Sliding Door Center -->
  
  <!-- Windows -->
  <rect x="95" y="48" width="42" height="24" rx="2" stroke="%231e293b" stroke-width="2" fill="none"/>
  <rect x="150" y="48" width="35" height="24" rx="2" stroke="%231e293b" stroke-width="2" fill="none"/>
  <path d="M45 48H75L85 80" stroke="%231e293b" stroke-width="1.5" fill="none" opacity="0.5"/> <!-- Windshield hint -->

  <!-- Wheels -->
  <circle cx="70" cy="130" r="12" fill="white" stroke="%2338bdf8" stroke-width="3"/>
  <circle cx="170" cy="130" r="12" fill="white" stroke="%2338bdf8" stroke-width="3"/>
  <circle cx="70" cy="130" r="4" fill="%2338bdf8"/>
  <circle cx="170" cy="130" r="4" fill="%2338bdf8"/>
</svg>`;

const KEI_TRUCK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none">
  <!-- Road Line -->
  <path d="M210 140H30" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round"/>

  <!-- Cabin (Distinct Head) -->
  <path d="M35 130V65C35 55 42 45 55 45H85V130H35Z" stroke="%231e293b" stroke-width="3" stroke-linejoin="round"/>
  <path d="M35 85H85" stroke="%231e293b" stroke-width="2"/> <!-- Window line -->
  <path d="M60 55L85 55" stroke="%231e293b" stroke-width="1.5" opacity="0.5"/> <!-- Window detail -->

  <!-- Cargo Bed (Flat) -->
  <rect x="90" y="95" width="115" height="35" stroke="%231e293b" stroke-width="3" fill="none"/>
  <path d="M90 110H205" stroke="%23cbd5e1" stroke-width="1"/> <!-- Bed detail line -->
  
  <!-- Cargo Visualization (Dotted) -->
  <path d="M90 95V60H190V95" stroke="%2338bdf8" stroke-width="2" stroke-dasharray="4 4" opacity="0.6"/>

  <!-- Wheels -->
  <circle cx="60" cy="130" r="12" fill="white" stroke="%2338bdf8" stroke-width="3"/>
  <circle cx="175" cy="130" r="12" fill="white" stroke="%2338bdf8" stroke-width="3"/>
  <circle cx="60" cy="130" r="4" fill="%2338bdf8"/>
  <circle cx="175" cy="130" r="4" fill="%2338bdf8"/>
</svg>`;

export const VEHICLES: Vehicle[] = [
  {
    id: 'keivan',
    name: 'Light Van',
    displayName: '軽バン',
    basePrice: 2500,
    perKmPrice: 400,
    capacity: '家具、洗濯機、電子製品など / 箱(60x30cm)6個 / スーツケース6個まで',
    dimensions: '高さ120cm × 幅140cm × 奥行190cm',
    maxWeight: 350,
    description: '屋根付きで雨天でも安心。大きな家具や家電の配送に最適です。規定量を超える荷物は追加料金が発生します。',
    icon: '🚐',
    image: KEI_VAN_SVG
  },
  {
    id: 'keitruck',
    name: 'Pick-up',
    displayName: '軽トラック',
    basePrice: 2800,
    perKmPrice: 400,
    capacity: '冷蔵庫 / 大型観葉植物 / 建材',
    dimensions: '幅140cm × 奥行190cm',
    maxWeight: 350,
    description: '高さのある荷物も積載可能. 積み下ろしが容易なトラックタイプ. また、建築資材や引っ越し荷物の運搬も可能です。',
    icon: '🛻',
    hasNoHeightLimit: true,
    image: KEI_TRUCK_SVG
  }
];

export const PLANS: Plan[] = [
  {
    id: 'single',
    name: '単身引っ越しプラン',
    price: '¥12,000〜',
    description: '学生や単身赴任の方に最適。軽バン1台で、段ボール20個＋布団＋小家電などを運びます。',
    features: ['ドライバー作業補助あり', 'ハンガーボックス貸出', '同乗可能(1名)'],
    recommended: true
  },
  {
    id: 'furniture',
    name: '家具・家電配送プラン',
    price: '¥5,000〜',
    description: 'フリマアプリで購入した冷蔵庫やソファーなど、大型家具1点から対応します。',
    features: ['大型家具の養生', '設置まで対応', '不要家具の回収相談可']
  },
  {
    id: 'charter',
    name: '半日チャータープラン',
    price: '¥18,000〜',
    description: '4時間以内の自由な利用。複数箇所の配送や、買い出し・搬入など自由に使えます。',
    features: ['ルート自由', '時間内距離無制限', '待機料金なし']
  }
];