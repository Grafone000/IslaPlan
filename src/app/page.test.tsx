import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

describe('Home', () => {
  it('shows the IslaPlan name on the first photo', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('IslaPlan');
  });

  it('opens the menu from the three lines, with a Log in link', async () => {
    render(<Home />);
    expect(screen.queryByRole('dialog')).toBeNull();
    openMenu();
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/login'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('offers My area and Log out in the menu once logged in', async () => {
    mocks.currentAccount.mockResolvedValue({ id: 'account-1' });
    render(<Home />);
    openMenu();
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'My area' }).getAttribute('href')).toBe('/account'),
    );
    expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Log in' })).toBeNull();
  });

  it('says You celebrate, We coordinate, with links down the page', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 2, name: /You celebrate\s*We coordinate/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: '• Plan your event' }).getAttribute('href')).toBe('#book');
    expect(screen.getByRole('link', { name: '• See what we do' }).getAttribute('href')).toBe(
      '#events',
    );
  });

  it('lists every event type we plan', () => {
    render(<Home />);
    for (const item of home.events.items) {
      expect(screen.getByText(item)).toBeTruthy();
    }
  });

  it('ends with the button that starts the planning', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Let’s start planning' }).getAttribute('href')).toBe(
      '/plan',
    );
    expect(screen.getByText(home.book.body)).toBeTruthy();
  });
});

describe('home content', () => {
  it('keeps the story text exactly as supplied', () => {
    expect(`${home.story.title} ${home.story.titleEmphasis}`).toBe(
      'Bring the party home. We’ll take care of the rest.',
    );
    expect(home.story.paragraphs).toEqual([
      'Planning a celebration at home should feel exciting, not stressful. We work with a trusted selection of reliable suppliers and take care of the coordination behind the scenes, bringing every detail together so your event runs smoothly.',
      'You stay in control of the choices. From delicious food and drinks to music and entertainment, décor and those special finishing touches, you can select the elements that make your celebration uniquely yours.',
      'Simply tell us your vision and we can make it happen. If you can imagine it, we can make it reality.',
      'Once you’ve made your selections, you’ll receive an estimated proposal based on your choices. If you’re happy to take things further, we’ll be delighted to get in touch, confirm the details and start bringing your plans to life.',
    ]);
  });
});
