import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Joke } from '../model/joke.model';

@Injectable({
  providedIn: 'root',
})
export class JokesService {
  private pathService = 'http://localhost:8080/api/joke';

  private subject: BehaviorSubject<Joke | null> =
    new BehaviorSubject<Joke | null>(null);

  constructor(private httpClient: HttpClient) {
    console.log('test22');
    this.getRandomJoke();
  }

  public getRandomJoke(): void {
    this.httpClient
      .get<Joke>(this.pathService)
      .subscribe((joke: Joke) => this.subject.next(joke));
  }

  public joke$(): Observable<Joke | null> {
    return this.subject.asObservable();
  }
}
