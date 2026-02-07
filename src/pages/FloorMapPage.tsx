import { useEffect } from 'react';
import { useAppStore } from '../store';
import ContextBar from '../components/ContextBar';
import FloorSelector from '../components/FloorSelector';
import ViewerMain from '../components/ViewerMain';

interface Props { active: boolean; }

export default function FloorMapPage({ active }: Props) {
  const { currentPage } = useAppStore();

  useEffect(() => {
    if (active && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, [active, currentPage]);

  if (!active) return null;

  return (
    <div className="page active">
      <ContextBar />
      <div className="viewer-layout">
        <ViewerMain />
        <FloorSelector />
      </div>
    </div>
  );
}
