import React from 'react';

export function useSubscribe(props) {
  const _props = React.useRef(props);
  _props.current = props;
  React.useEffect(() => {
    const tearDown = (subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };

    const subscription =
      _props.current.subject.subscribe({
        next: _props.current.callback,
      });

    return () => tearDown(subscription);
  }, []);
}
