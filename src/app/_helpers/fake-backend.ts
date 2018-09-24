import {Injectable} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {delay, dematerialize, materialize, mergeMap} from 'rxjs/operators';

@Injectable()
export class FakeBackend implements HttpInterceptor{
  constructor() {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let users: any[] = JSON.parse(localStorage.getItem('users')) || [];
    return of(null).pipe(mergeMap(() => {
      // authenticate
      if (request.url.endsWith('/users/authenticate') && request.method === 'POST') {
        const filteredUsers = users.filter(user => {
          return user.username === request.body.username && user.password === request.body.password;
        })
        // if login details are valid return 200 OK with user details and fake jwt token
        if (filteredUsers.length) {
          const user = filteredUsers[0];
          const body = {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            token: 'fake-token'
          };
          return of(new HttpResponse({status: 200, body: body}));
        } else {
          return throwError({error: { message: 'username or password is incorrect'}});
        }
      }
      // get users
      if (request.url.endsWith('/users') && request.method === 'GET') {
        if (request.headers.get('Authorization') === 'Bearer fake-token') {
          return of(new HttpResponse({status: 200, body: users}));
        } else {
          return throwError({ status: 401, error: { message: 'Unauthorized'}});
        }
      }
      // get user by id
      if (request.url.match(/\/users\/\d+$/) && request.method === 'GET') {
        if ( request.headers.get('Authorization') === 'Bearer fake-token') {
          const urlParts = request.url.split('/');
          const id = parseInt((urlParts[urlParts.length - 1]), 10);
          const matchedUser = users.filter( (item) => {
            return item.id === id;
          });
          const user = matchedUser.length ? matchedUser[0] : null;
          return of(new HttpResponse({status: 200, body: user}));
        } else {
          return throwError({ status: 401, error: { message: 'Unauthorized'}});
        }
      }
      // register user
      if (request.url.endsWith('/users/register') && request.method === 'POST') {
        const newUser = request.body;
        const duplicateUser = users.filter( item => {
          return item.username === newUser.username;
        }).length;
        if (duplicateUser) {
          return throwError( {error: { message: 'Username "' + newUser.username + '" is already taken' }});
        }
        newUser.id = users.length + 1;
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        const body = {
          message: 'user register success'
        }
        return of(new HttpResponse({status: 200, body: body}));
      }
      if (request.url.match(/\/users\/\d+$/) && request.method === 'DELETE') {
        const urlParts = request.url.split('/');
        const id = parseInt(urlParts[urlParts.length - 1], 10);
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          if (user.id === id) {
            // delete user
            users.splice(i, 1);
            localStorage.setItem('users', JSON.stringify(users));
            break;
          }
        }
        const body = {
          message: 'delete success'
        };
        return of(new HttpResponse({ status: 200, body: body}));
      } else {
        return throwError({status: 401, error: { message: 'Unauthorised'}});
      }
      return next.handle(request);
    }))
      .pipe(materialize())
      .pipe(delay(500))
      .pipe(dematerialize());
  }
}

export let fakeBackendProvider = {
  // use fake backend in place of Http service for backend-less development
  provide: HTTP_INTERCEPTORS,
  useClass: FakeBackend,
  multi: true
};
