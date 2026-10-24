import { describe, expect, it } from 'vitest';
import { localLandmarks, localPlaceName, startLocation } from './StartLocations';
import { validateLocalMap } from '../ui/LocalMap';
import map from '../../public/maps/ganderkesee-map.json';

describe('sourced Ganderkesee starting region',()=>{
  it('migrates omitted locations but rejects unsupported saved locations',()=>{
    expect(startLocation().id).toBe('ganderkesee');
    expect(()=>startLocation('invented')).toThrow('Startort');
    expect(()=>startLocation(null)).toThrow();
  });
  it('does not invent a Bronze Age place name or expose a future church or organ',()=>{
    expect(localPlaceName(-1999)).toContain('heutigen');
    expect(localLandmarks(-1999).map(l=>l.id)).toEqual(['steinkimmen','stenum']);
    expect(localLandmarks(1051).some(l=>l.id==='church')).toBe(false);
    expect(localLandmarks(1052).some(l=>l.id==='church')).toBe(true);
    expect(localLandmarks(1698).some(l=>l.id==='organ')).toBe(false);
    expect(localLandmarks(1699).some(l=>l.id==='organ')).toBe(true);
  });
  it('ships a metre-projected map with real local rivers and landmarks inside its bounds',()=>{
    const data=validateLocalMap(map);
    expect(data.bounds[2]-data.bounds[0]).toBe(20000);
    expect(data.bounds[3]-data.bounds[1]).toBe(14000);
    expect(data.width/data.height).toBe(20000/14000);
    expect(new Set(data.rivers.map(r=>r.name))).toContain('Dummbäke');
    expect(new Set(data.rivers.map(r=>r.name))).toContain('Welse');
    for(const [x,y] of Object.values(data.places)) {
      expect(x).toBeGreaterThan(0);expect(x).toBeLessThan(data.width);
      expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(data.height);
    }
    expect(()=>validateLocalMap({...data,rivers:[]})).toThrow();
  });
});
