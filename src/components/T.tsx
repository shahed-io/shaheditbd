import { useText } from '@/hooks/useTextOverrides';

interface TProps {
  /** Unique registry key, e.g. "home.hero.title" */
  id: string;
  /** Optional inline default; falls back to TEXT_REGISTRY default if omitted. */
  children?: string;
  /** Optional className passed through to wrapping <span>. */
  className?: string;
  /** Render as a different element. Defaults to span. */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'strong' | 'em';
}

/**
 * Editable text component. Looks up `id` in the text_overrides table; falls back to
 * `children` or the registry default. Admins can edit the value from /ceo/text-manager.
 *
 *   <T id="home.hero.title">Welcome</T>
 */
export const T = ({ id, children, className, as: Tag = 'span' }: TProps) => {
  const value = useText(id, children);
  return <Tag className={className}>{value}</Tag>;
};

export default T;
