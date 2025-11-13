// Avoid importing the real TSX module at top-level so Jest doesn't try to
// parse JSX before mocks/transformers are applied. Instead, mock the
// module first and then require it — this keeps the test fast and avoids
// needing to transform the real component in this smoke test.
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlantPreview from '@/components/ui/PlantPreview';

const mockPlant = {
  id: 'oak_tree',
  name: { en: 'Oak Tree' },
  emoji: '🌳',
};

describe('PlantPreview (RTL)', () => {
  it('renders plant emoji and name with correct aria attributes when visible', () => {
    render(<PlantPreview plant={mockPlant as any} visible x={100} y={100} />);

    const labelled = screen.getByRole('img', { name: /Preview (oak_tree|Oak Tree)/i });
    expect(labelled).toBeInTheDocument();
    expect(labelled).toHaveTextContent('🌳');
    expect(labelled).toHaveTextContent(/Oak Tree|oak_tree/i);
  });

  it('renders nothing when not visible or when plant is null', () => {
    const { container: c1 } = render(<PlantPreview plant={mockPlant as any} visible={false} />);
    expect(c1).toBeEmptyDOMElement();

    const { container: c2 } = render(<PlantPreview plant={null} visible />);
    expect(c2).toBeEmptyDOMElement();
  });
});
