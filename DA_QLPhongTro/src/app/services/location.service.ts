import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, switchMap } from 'rxjs';

type ProvinceItem = { code: number; name: string };
type DistrictItem = { code: number; name: string };
type WardItem = { code: number; name: string };

type ProvinceWithDistricts = ProvinceItem & { districts: DistrictItem[] };
type DistrictWithWards = DistrictItem & { wards: WardItem[] };

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly apiBase = 'https://provinces.open-api.vn/api';

  private readonly provinces$: Observable<ProvinceItem[]>;
  private readonly provinceNameToCode$: Observable<Map<string, number>>;

  private readonly provinceDetailCache = new Map<number, Observable<ProvinceWithDistricts>>();
  private readonly districtDetailCache = new Map<number, Observable<DistrictWithWards>>();

  constructor(private http: HttpClient) {
    this.provinces$ = this.http
      .get<ProvinceItem[]>(`${this.apiBase}/?depth=1`)
      .pipe(shareReplay(1));

    this.provinceNameToCode$ = this.provinces$.pipe(
      map((items) => {
        const m = new Map<string, number>();
        (items || []).forEach((p) => {
          const name = String(p?.name || '').trim();
          const code = Number(p?.code);
          if (name && Number.isFinite(code)) m.set(name, code);
        });
        return m;
      }),
      shareReplay(1)
    );
  }

  getProvinces(): Observable<string[]> {
    return this.provinces$.pipe(
      map((items) => (items || []).map((p) => p.name).filter(Boolean).sort((a, b) => a.localeCompare(b)))
    );
  }

  getDistricts(provinceName: string): Observable<string[]> {
    const pName = String(provinceName || '').trim();
    if (!pName) return of([]);

    return this.provinceNameToCode$.pipe(
      map((m) => m.get(pName) || 0),
      switchMap((code) => {
        if (!code) return of([]);
        return this.getProvinceDetail(code).pipe(
          map((p) =>
            (p?.districts || [])
              .map((d) => d?.name)
              .filter(Boolean)
              .sort((a, b) => String(a).localeCompare(String(b))) as string[]
          ),
          catchError(() => of([]))
        );
      }),
      catchError(() => of([]))
    );
  }

  getWards(provinceName: string, districtName: string): Observable<string[]> {
    const pName = String(provinceName || '').trim();
    const dName = String(districtName || '').trim();
    if (!pName || !dName) return of([]);

    return this.provinceNameToCode$.pipe(
      map((m) => m.get(pName) || 0),
      switchMap((provinceCode) => {
        if (!provinceCode) return of([]);
        return this.getProvinceDetail(provinceCode).pipe(
          map((p) => (p?.districts || []).find((x) => String(x?.name || '').trim() === dName)),
          switchMap((district) => {
            const districtCode = Number(district?.code);
            if (!Number.isFinite(districtCode)) return of([]);
            return this.getDistrictDetail(districtCode).pipe(
              map((d) =>
                (d?.wards || [])
                  .map((w) => w?.name)
                  .filter(Boolean)
                  .sort((a, b) => String(a).localeCompare(String(b))) as string[]
              ),
              catchError(() => of([]))
            );
          }),
          catchError(() => of([]))
        );
      }),
      catchError(() => of([]))
    );
  }

  private getProvinceDetail(code: number): Observable<ProvinceWithDistricts> {
    const c = Number(code);
    if (!Number.isFinite(c)) return of({ code: 0, name: '', districts: [] });

    const cached = this.provinceDetailCache.get(c);
    if (cached) return cached;

    const req$ = this.http
      .get<ProvinceWithDistricts>(`${this.apiBase}/p/${c}?depth=2`)
      .pipe(shareReplay(1));
    this.provinceDetailCache.set(c, req$);
    return req$;
  }

  private getDistrictDetail(code: number): Observable<DistrictWithWards> {
    const c = Number(code);
    if (!Number.isFinite(c)) return of({ code: 0, name: '', wards: [] });

    const cached = this.districtDetailCache.get(c);
    if (cached) return cached;

    const req$ = this.http
      .get<DistrictWithWards>(`${this.apiBase}/d/${c}?depth=2`)
      .pipe(shareReplay(1));
    this.districtDetailCache.set(c, req$);
    return req$;
  }
}
