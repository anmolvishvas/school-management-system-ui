import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { StudentsService } from './students.service';
import { environment } from '../../../environments/environment';

describe('StudentsService', () => {
  let service: StudentsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StudentsService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(StudentsService);
    http = TestBed.inject(HttpTestingController);
  });

  it('should request paged students with query params', () => {
    service
      .getPage({
        page: 2,
        pageSize: 10,
        search: 'ann',
        sortBy: 'name',
        order: 'desc',
        className: '10',
        section: 'A',
        activeOnly: true
      })
      .subscribe((res) => expect(res.data).toEqual([]));

    const req = http.expectOne(
      (r) =>
        r.url === `${environment.apiBaseUrl}/api/Students` &&
        r.params.get('page') === '2' &&
        r.params.get('activeOnly') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], total: 0 });
  });
});
