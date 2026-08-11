import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecentObservations from './RecentObservations';
import { DeveloperReview } from '@/data/mockData';

function makeObservation(overrides: Partial<DeveloperReview> & Pick<DeveloperReview, 'id'>) {
  return {
    taskName: 'Integración de pagos',
    date: '2026-07-24T14:30:00.000Z',
    score: 93,
    status: 'approved' as const,
    kpis: { pixelPerfect: 100, cumplimientoDod: 100, calidadVisual: 100, erroresVisuales: 0, retrabajo: 0 },
    details: 'Todo bien',
    qaAnalyst: 'QA',
    developerName: 'Cristian Sabogal',
    ...overrides
  };
}

describe('RecentObservations', () => {
  it('no renderiza nada cuando no hay revisiones', () => {
    const { container } = render(<RecentObservations reviews={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el código de revisión, el developer y el detalle de cada observación', () => {
    render(<RecentObservations reviews={[makeObservation({ id: '1', reviewCode: 'REV-2026-004', details: 'Quedó excelente' })]} />);

    expect(screen.getByText('REV-2026-004')).toBeInTheDocument();
    expect(screen.getByText('Cristian Sabogal')).toBeInTheDocument();
    expect(screen.getByText('Quedó excelente')).toBeInTheDocument();
  });

  it('llama a onSelectReview con el id al hacer click en una observación', () => {
    const onSelectReview = vi.fn();
    render(
      <RecentObservations
        reviews={[makeObservation({ id: 'rev-1', reviewCode: 'REV-2026-001' })]}
        onSelectReview={onSelectReview}
      />
    );

    fireEvent.click(screen.getByText('REV-2026-001'));
    expect(onSelectReview).toHaveBeenCalledWith('rev-1');
  });
});
