import { describe, expect, it, vi } from 'vitest';

describe('declared requirements', () => {
  it('excludes untouched defaults, includes deliberate answers and excludes now-hidden answers', async () => {
    vi.resetModules();
    const { declaredRequirements, updateRequirementsState } = await import('./RequirementsEngine');
    expect(declaredRequirements()).toEqual({});
    updateRequirementsState('appointmentsPerWeek', '250-500');
    updateRequirementsState('wms', 'none'); // An explicitly chosen default is a real answer.
    updateRequirementsState('painPoints', ['dwell-time']);
    expect(declaredRequirements()).toEqual({ appointmentsPerWeek: '250-500', wms: 'none', painPoints: ['dwell-time'] });
    updateRequirementsState('erp', 'other');
    updateRequirementsState('erpOther', 'Our ERP');
    expect(declaredRequirements()).toHaveProperty('erpOther', 'Our ERP');
    updateRequirementsState('erp', 'netsuite');
    expect(declaredRequirements()).not.toHaveProperty('erpOther');
    expect(declaredRequirements()).not.toHaveProperty('parentCarrierMix');
    expect(declaredRequirements()).not.toHaveProperty('childCarrierMix');
    updateRequirementsState('parentCarrierMix', { dedicated: 0.5, company: 0.25, customer: 0.25 });
    expect(declaredRequirements()).toHaveProperty('parentCarrierMix', { dedicated: 0.5, company: 0.25, customer: 0.25 });
  });
});
