export default function SideField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}
