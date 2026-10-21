import { ZONES } from '../data/zones';
import type { ZoneHolder } from '../data/zones';

function HolderBlock({ label, holder, variant }: { label: string; holder: ZoneHolder; variant: 'holder' | 'wanted' }) {
  return (
    <div className={`zone-holder zone-holder--${variant}`}>
      <div className="zone-holder-label">{label}</div>
      <div className="zone-holder-body">
        <img className="zone-holder-avatar" src={holder.avatar} alt="" />
        <div>
          <div className="zone-holder-name">{holder.name}</div>
          <div className="zone-holder-authority">👑 {holder.authority.toLocaleString('ru-RU')}</div>
        </div>
      </div>
    </div>
  );
}

export default function ZonesPage() {
  return (
    <div className="zones-page">
      <div className="zones-header">Выбор этапа</div>
      <div className="zones-list">
        {ZONES.map((z) => (
          <div key={z.id} className="zone-card">
            <div className="zone-main">
              <div className="zone-name">{z.name}</div>
              <img className="zone-image" src={z.image} alt="" />
              <button className="zone-sit-btn">Отсидеть</button>
            </div>
            <HolderBlock label="Держит зону!" holder={z.holder} variant="holder" />
            <HolderBlock label="Особо опасен!" holder={z.mostWanted} variant="wanted" />
          </div>
        ))}
      </div>
    </div>
  );
}