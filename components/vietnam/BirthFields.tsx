'use client';
import { useId } from 'react';
import type { VietnamBirthInput } from '@/lib/vietnam/types';

export type BirthDraft = {
  year: string;
  month: string;
  day: string;
  clockHour: string;
  clockMinute: string;
  gender: 'male' | 'female';
  name: string;
  birthplace: string;
  longitude: string;
  timeMode: 'clock' | 'mean-solar' | 'apparent-solar';
  lateTyRule: 'next-day' | 'current-day';
  unknownTime: boolean;
  assumedHour: string;
};
export const emptyBirth = (): BirthDraft => ({
  year: '',
  month: '',
  day: '',
  clockHour: '',
  clockMinute: '',
  gender: 'male',
  name: '',
  birthplace: '',
  longitude: '',
  timeMode: 'clock',
  lateTyRule: 'next-day',
  unknownTime: false,
  assumedHour: '',
});
export function parseBirth(d: BirthDraft): VietnamBirthInput {
  const year = Number(d.year),
    month = Number(d.month),
    day = Number(d.day);
  if (
    !d.year ||
    !d.month ||
    !d.day ||
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 2050 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    new Date(Date.UTC(year, month, 0)).getUTCDate() < day
  )
    throw new Error('Vui lòng nhập ngày sinh hợp lệ trong khoảng 1900–2050.');
  if (d.unknownTime && d.assumedHour === '')
    throw new Error('Vui lòng chọn giờ giả định để lập lá số tạm tính.');
  const hour = d.unknownTime ? d.assumedHour : d.clockHour;
  const minute = d.unknownTime ? '0' : d.clockMinute;
  if (
    hour === '' ||
    minute === '' ||
    !Number.isInteger(Number(hour)) ||
    Number(hour) < 0 ||
    Number(hour) > 23 ||
    !Number.isInteger(Number(minute)) ||
    Number(minute) < 0 ||
    Number(minute) > 59
  )
    throw new Error('Vui lòng nhập giờ và phút hợp lệ.');
  const longitude = d.longitude.trim() === '' ? undefined : Number(d.longitude);
  if (d.timeMode !== 'clock' && longitude === undefined)
    throw new Error('Vui lòng nhập kinh độ để hiệu chỉnh giờ mặt trời.');
  if (
    longitude !== undefined &&
    (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
  )
    throw new Error('Kinh độ phải nằm trong khoảng −180 đến 180.');
  return {
    year,
    month,
    day,
    clockHour: Number(hour),
    clockMinute: Number(minute),
    gender: d.gender,
    name: d.name.trim() || undefined,
    birthplace: d.birthplace.trim() || undefined,
    longitude,
    timeMode: d.timeMode,
    lateTyRule: d.lateTyRule,
    unknownTime: d.unknownTime,
  };
}
export function BirthFields({
  value,
  onChange,
  legend,
}: {
  value: BirthDraft;
  onChange: (value: BirthDraft) => void;
  legend?: string;
}) {
  const id = useId();
  function set<K extends keyof BirthDraft>(key: K, next: BirthDraft[K]) {
    onChange({ ...value, [key]: next });
  }
  return (
    <fieldset className="viet-form">
      <legend>{legend || 'Thông tin sinh'}</legend>
      <label>
        Họ và tên (không bắt buộc)
        <input
          value={value.name}
          maxLength={100}
          onChange={(e) => set('name', e.target.value)}
        />
      </label>
      <div className="viet-fields">
        {(['day', 'month', 'year'] as const).map((key, i) => (
          <label key={key}>
            {['Ngày', 'Tháng', 'Năm'][i]}
            <input
              type="number"
              inputMode="numeric"
              value={value[key]}
              min={key === 'year' ? 1900 : 1}
              max={key === 'year' ? 2050 : key === 'month' ? 12 : 31}
              onChange={(e) => set(key, e.target.value)}
            />
          </label>
        ))}
      </div>
      <p className="viet-hint">Ngày sinh dương lịch, từ năm 1900 đến 2050.</p>
      <label>
        Giới tính dùng để an sao
        <select
          value={value.gender}
          onChange={(e) =>
            set('gender', e.target.value as BirthDraft['gender'])
          }
        >
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>
      </label>
      <label className="viet-check">
        <input
          type="checkbox"
          checked={value.unknownTime}
          onChange={(e) => set('unknownTime', e.target.checked)}
        />
        Không biết giờ sinh
      </label>
      {value.unknownTime ? (
        <label>
          Giờ giả định
          <select
            value={value.assumedHour}
            onChange={(e) => set('assumedHour', e.target.value)}
          >
            <option value="">Chọn giờ giả định</option>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="viet-fields">
          <label>
            Giờ
            <input
              type="number"
              min="0"
              max="23"
              inputMode="numeric"
              value={value.clockHour}
              onChange={(e) => set('clockHour', e.target.value)}
            />
          </label>
          <label>
            Phút
            <input
              type="number"
              min="0"
              max="59"
              inputMode="numeric"
              value={value.clockMinute}
              onChange={(e) => set('clockMinute', e.target.value)}
            />
          </label>
        </div>
      )}
      <label>
        Nơi sinh (không bắt buộc)
        <input
          list={id}
          value={value.birthplace}
          maxLength={150}
          onChange={(e) => set('birthplace', e.target.value)}
        />
        <datalist id={id}>
          <option value="Hà Nội" />
          <option value="Thành phố Hồ Chí Minh" />
          <option value="Đà Nẵng" />
          <option value="Cần Thơ" />
          <option value="Huế" />
        </datalist>
      </label>
      <details>
        <summary>Thiết lập thời gian nâng cao</summary>
        <label>
          Kinh độ (bắt buộc khi dùng giờ mặt trời)
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            value={value.longitude}
            onChange={(e) => set('longitude', e.target.value)}
          />
        </label>
        <label>
          Cách tính giờ
          <select
            value={value.timeMode}
            onChange={(e) =>
              set('timeMode', e.target.value as BirthDraft['timeMode'])
            }
          >
            <option value="clock">Giờ dân sự UTC+7</option>
            <option value="mean-solar">Giờ mặt trời trung bình</option>
            <option value="apparent-solar">Giờ mặt trời biểu kiến</option>
          </select>
        </label>
        <label>
          Quy ước giờ Tý muộn (từ 23 giờ)
          <select
            value={value.lateTyRule}
            onChange={(e) =>
              set('lateTyRule', e.target.value as BirthDraft['lateTyRule'])
            }
          >
            <option value="next-day">Tính sang ngày hôm sau</option>
            <option value="current-day">Giữ ngày hiện tại</option>
          </select>
        </label>
      </details>
    </fieldset>
  );
}
