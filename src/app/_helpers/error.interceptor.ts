import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {AuthenticationService} from '../_services/authentication.service';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
/*
* The Error Interceptor intercepts http responses from the api to check if there were any errors
* If there is a 401 Unauthorized response the user is automatically logged out of the application
* All other errors are re-thrown to be caught by the calling service so an alert can be displayed to the user.
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor{
  constructor(
    private authenticationService: AuthenticationService
  ) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError(err => {
      // auto logout if 401 response returned from api
      if (err.status === 401) {
        this.authenticationService.logout();
        location.reload(true);
      }
      const error = err.error.messages || err.statusText;
      return throwError(error);
    }));
  }
}
