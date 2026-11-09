// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BirthFields } from '../components/vietnam/BirthFields';
afterEach(cleanup);
import { emptyBirth, parseBirth } from '../components/vietnam/BirthFields';

const valid = {
  ...emptyBirth(),
  year: '2000',
  month: '2',
  day: '29',
  clockHour: '23',
  clockMinute: '59',
};
describe('Kiểm tra dữ kiện sinh', () => {
  it('accepts leap day and retains explicit time convention', () =>
    expect(parseBirth({ ...valid, lateTyRule: 'current-day' })).toMatchObject({
      year: 2000,
      month: 2,
      day: 29,
      clockHour: 23,
      clockMinute: 59,
      lateTyRule: 'current-day',
      timeMode: 'clock',
      unknownTime: false,
    }));
  it.each([
    { day: '30' },
    { year: '1899' },
    { year: '2051' },
    { month: '13' },
    { clockMinute: '60' },
    { clockHour: '24' },
    { longitude: '181' },
    { timeMode: 'mean-solar' as const },
  ])('rejects invalid fields %o', (changes) =>
    expect(() => parseBirth({ ...valid, ...changes })).toThrow(),
  );
  it('requires an explicit assumption and retains the selected hour', () => {
    expect(() => parseBirth({ ...valid, unknownTime: true })).toThrow(
      /giờ giả định/,
    );
    expect(
      parseBirth({ ...valid, unknownTime: true, assumedHour: '0' }),
    ).toMatchObject({ clockHour: 0, clockMinute: 0, unknownTime: true });
  });
  it('accepts a supplied longitude for solar time', () =>
    expect(
      parseBirth({ ...valid, timeMode: 'mean-solar', longitude: '105' }),
    ).toMatchObject({ longitude: 105, timeMode: 'mean-solar' }));
});

it('edits optional information and advanced conventions accessibly', () => {
  const Wrapper = () => {
    const [draft, setDraft] = useState(emptyBirth);
    return <BirthFields value={draft} onChange={setDraft} />;
  };
  render(<Wrapper />);
  fireEvent.change(screen.getByLabelText(/Họ và tên/), {
    target: { value: 'An' },
  });
  fireEvent.change(screen.getByLabelText(/Giới tính/), {
    target: { value: 'female' },
  });
  fireEvent.change(screen.getByLabelText(/Nơi sinh/), {
    target: { value: 'Hà Nội' },
  });
  fireEvent.click(screen.getByText('Thiết lập thời gian nâng cao'));
  fireEvent.change(screen.getByLabelText(/Kinh độ/), {
    target: { value: '105' },
  });
  fireEvent.change(screen.getByLabelText('Cách tính giờ'), {
    target: { value: 'mean-solar' },
  });
  fireEvent.change(screen.getByLabelText(/Quy ước giờ Tý/), {
    target: { value: 'current-day' },
  });
  expect(screen.getByLabelText(/Họ và tên/)).toHaveValue('An');
  expect(screen.getByLabelText(/Giới tính/)).toHaveValue('female');
  expect(screen.getByLabelText('Cách tính giờ')).toHaveValue('mean-solar');
  expect(screen.getByLabelText(/Quy ước giờ Tý/)).toHaveValue('current-day');
});
