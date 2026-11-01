import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { home } from '@/content/home';
import Home from './page';

const mocks = vi.hoisted(() => ({ currentAccount: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/integrations', () => ({
  auth: { currentAccount: mocks.currentAccount, logout: vi.fn() },
}));

beforeEach(() => {
  mocks.currentAccount.mockResolvedValue(null);
});

afterEach(cleanup);

describe('Home', () => {
  it('shows the main title at the top', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      "Bring the party home. We'll take care of the rest.",
    );
  });

  it('sends every Book your event button to the wizard', () => {
    render(<Home />);
    const links = screen.getAllByRole('link', { name: 'Book your event' });
    expect(links).toHaveLength(2);
    expect(links.every((link) => link.getAttribute('href') === '/plan')).toBe(true);
  });

  it('has a Log in link to the login page', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/login');
  });

  it('offers My area and Log out once logged in', async () => {
    mocks.currentAccount.mockResolvedValue({ id: 'account-1' });
    render(<Home />);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'My area' }).getAttribute('href')).toBe('/account'),
    );
    expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Log in' })).toBeNull();
  });

  it('shows the three photo sections with their images', () => {
    render(<Home />);
    for (const experience of home.experiences) {
      expect(screen.getByRole('heading', { level: 2, name: experience.title })).toBeTruthy();
      expect(screen.getByText(experience.body)).toBeTruthy();
      expect(screen.getByAltText(experience.image.alt)).toBeTruthy();
    }
  });

  it('does not show the draft palette switcher', () => {
    render(<Home />);
    expect(screen.queryByRole('button', { name: 'Change palette' })).toBeNull();
  });
});

describe('home content', () => {
  it('keeps the main text exactly as supplied', () => {
    expect(`${home.hero.title} ${home.hero.titleEmphasis}`).toBe(
      "Bring the party home. We'll take care of the rest.",
    );
    expect(home.choices.paragraphs).toEqual([
      'Planning a celebration at home should feel exciting, not stressful. We work with a trusted selection of reliable suppliers, and we take care of the coordination behind the scenes, bringing every detail together so your event runs smoothly.',
      'You stay in control of the choices. From delicious food and drinks to music and entertainment, décor and those special finishing touches, you can select the elements that make your celebration uniquely yours.',
      'Simply tell us your vision and we can make it happen. If you can imagine it, we can make it reality.',
      "Once you've made your selections, you'll receive an estimated proposal based on your choices. If you're happy to take things further, we'll be delighted to get in touch, confirm the details and start bringing your plans to life.",
    ]);
  });
});
