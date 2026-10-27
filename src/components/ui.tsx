import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { X } from "lucide-react";

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export function Button({ className, variant = "default", size = "default", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "secondary" | "outline" | "ghost" | "destructive"; size?: "default" | "sm" | "icon" }) {
  return <button className={cx("ui-button", `ui-button-${variant}`, `ui-button-${size}`, className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("ui-input", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("ui-textarea", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx("ui-select", className)} {...props}>{children}</select>;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-card", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-card-header", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-card-content", className)} {...props} />;
}

export function Badge({ className, variant = "secondary", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" }) {
  return <span className={cx("ui-badge", `ui-badge-${variant}`, className)} {...props} />;
}

export function Avatar({ name, size = "default" }: { name: string; size?: "default" | "sm" | "lg" }) {
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return <span className={cx("ui-avatar", `ui-avatar-${size}`)} aria-label={name}>{initials}</span>;
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return <span className="ui-label">{children}{hint && <small>{hint}</small>}</span>;
}

export function Text({ as = "p", className, children }: { as?: "h1" | "h2" | "h3" | "p" | "span" | "small" | "strong"; className?: string; children: ReactNode }) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

export function Separator({ vertical = false }: { vertical?: boolean }) {
  return <span className={cx("ui-separator", vertical && "ui-separator-vertical")} aria-hidden="true" />;
}

export function Progress({ value }: { value: number }) {
  return <span className="ui-progress" role="progressbar" aria-valuenow={value}><span style={{ width: `${value}%` }} /></span>;
}

export function Tabs({ items, active, onChange }: { items: Array<{ id: string; label: string; count?: number }>; active: string; onChange: (id: string) => void }) {
  return <div className="ui-tabs">{items.map((item) => <Button key={item.id} variant="ghost" className={active === item.id ? "is-active" : ""} onClick={() => onChange(item.id)}>{item.label}{item.count !== undefined && <Badge>{item.count}</Badge>}</Button>)}</div>;
}

export function Dialog({ open, title, description, onClose, children, footer }: { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return <div className="ui-dialog-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="ui-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="ui-dialog-header">
        <div><Text as="h2" className="ui-dialog-title">{title}</Text>{description && <Text className="ui-dialog-description">{description}</Text>}</div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar"><X /></Button>
      </div>
      <div className="ui-dialog-content">{children}</div>
      {footer && <div className="ui-dialog-footer">{footer}</div>}
    </div>
  </div>;
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <Button type="button" variant="ghost" className={cx("ui-switch-row", checked && "is-checked")} onClick={() => onChange(!checked)} aria-pressed={checked}>
    <span className="ui-switch"><span /></span><Text as="span">{label}</Text>
  </Button>;
}
