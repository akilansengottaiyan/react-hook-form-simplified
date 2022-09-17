export function createSubject() {
  let _observers = [];
  const next = (value) => {
    for (const observer of _observers) {
      observer.next(value);
    }
  };
  const subscribe = (observer) => {
    _observers.push(observer);
  };
  const unsubscribe = () => {
    _observers = [];
  };

  return {
    next,
    subscribe,
    unsubscribe
  };
}
