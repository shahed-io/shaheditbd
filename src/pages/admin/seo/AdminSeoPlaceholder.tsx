import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  color?: string;
}

const AdminSeoPlaceholder = ({ title, description, icon: Icon, color = 'hsl(258,78%,55%)' }: Props) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        {title}
      </h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
    <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1.5px solid ${color}30` }}>
        <Icon size={28} style={{ color }} />
      </div>
      <div>
        <h3 className="font-bold text-foreground text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">{description}</p>
      </div>
      <div className="mt-2 px-4 py-2 rounded-xl text-xs font-medium"
        style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>
        Coming Soon — Under Development
      </div>
    </div>
  </div>
);

export default AdminSeoPlaceholder;
