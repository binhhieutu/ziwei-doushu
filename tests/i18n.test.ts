import { describe, expect, it } from 'vitest';
import {
  canChiLabel,
  PALACE_GUIDE,
  STAR_GUIDE,
  viLabel,
  VI_BRANCHES,
  VI_STEMS,
} from '@/lib/i18n/vi';

describe('Vietnamese display labels preserve engine identifiers', () => {
  it('translates principal stars, palaces, brightness and transformations', () => {
    expect(viLabel('紫微')).toBe('Tử Vi');
    expect(viLabel('仆役')).toBe('Nô Bộc');
    expect(viLabel('命宫')).toBe('Mệnh');
    expect(viLabel('庙')).toBe('Miếu');
    expect(viLabel('忌')).toBe('Hóa Kỵ');
    expect(viLabel('水二局')).toBe('Thủy nhị cục');
  });
  it('formats can chi and leaves unknown source terms intact', () => {
    expect(canChiLabel('甲子')).toBe('Giáp Tý');
    expect(canChiLabel('丁亥')).toBe('Đinh Hợi');
    expect(canChiLabel('')).toBe('');
    expect(viLabel('unknown-engine-term')).toBe('unknown-engine-term');
    expect(viLabel('constructor')).toBe('constructor');
    expect(viLabel('__proto__')).toBe('__proto__');
    expect(VI_STEMS).toHaveLength(10);
    expect(VI_BRANCHES).toHaveLength(12);
  });
  it('has original Vietnamese learning material for all major stars and palaces', () => {
    expect(STAR_GUIDE).toHaveLength(14);
    expect(PALACE_GUIDE).toHaveLength(12);
    for (const item of [...STAR_GUIDE, ...PALACE_GUIDE]) {
      expect(item.name.length).toBeGreaterThan(1);
      expect(item.description.length).toBeGreaterThan(30);
      expect(item.id).toMatch(/^[a-z-]+$/);
    }
  });
});
