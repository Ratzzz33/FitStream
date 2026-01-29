import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AchievementRing } from '../../components/AchievementRings';

describe('AchievementRing', () => {
  const defaultProps = {
    radius: 50,
    stroke: 8,
    progress: 25,
    color: '#10b981',
    total: 100,
    label: 'Steps',
  };

  it('renders without crashing', () => {
    render(<AchievementRing {...defaultProps} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('displays the correct progress value', () => {
    render(<AchievementRing {...defaultProps} progress={75} />);
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('displays the total value', () => {
    render(<AchievementRing {...defaultProps} />);
    expect(screen.getByText('/ 100')).toBeInTheDocument();
  });

  it('displays the label', () => {
    render(<AchievementRing {...defaultProps} />);
    expect(screen.getByText('Steps')).toBeInTheDocument();
  });

  it('shows completion star when goal is met', () => {
    render(<AchievementRing {...defaultProps} progress={100} total={100} />);
    // Component uses emoji ⭐ for completion star
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('does not show star when goal is not met', () => {
    render(<AchievementRing {...defaultProps} progress={50} total={100} />);
    expect(screen.queryByText('⭐')).not.toBeInTheDocument();
  });

  it('handles progress exceeding total', () => {
    render(<AchievementRing {...defaultProps} progress={150} total={100} />);
    // Should still display actual progress
    expect(screen.getByText('150')).toBeInTheDocument();
    // Should show completion star
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('renders SVG with correct dimensions', () => {
    const { container } = render(<AchievementRing {...defaultProps} radius={60} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('height', '120');
    expect(svg).toHaveAttribute('width', '120');
  });

  it('renders without label when not provided', () => {
    const propsWithoutLabel = { ...defaultProps, label: undefined };
    const { container } = render(<AchievementRing {...propsWithoutLabel} />);
    expect(container.querySelector('.absolute')).not.toBeInTheDocument();
  });

  it('applies correct color to circles', () => {
    const { container } = render(<AchievementRing {...defaultProps} color="#ff0000" />);
    const circles = container.querySelectorAll('circle');
    circles.forEach(circle => {
      expect(circle).toHaveAttribute('stroke', '#ff0000');
    });
  });

  it('calculates stroke dashoffset correctly', () => {
    const { container } = render(<AchievementRing {...defaultProps} progress={50} total={100} />);
    const progressCircle = container.querySelectorAll('circle')[1];
    // When progress is 50%, dashoffset should be set via style attribute
    const style = progressCircle?.getAttribute('style') || '';
    expect(style).toContain('stroke-dashoffset');
  });
});
