import { useCallback, useState } from "react";

export default function useSpinner() {
  const [state, setState] = useState({
    loading: false,
    text: "Preparando todo...",
  });

  const show = useCallback((text = "Preparando todo...") => {
    setState({
      loading: true,
      text,
    });
  }, []);

  const hide = useCallback(() => {
    setState((prev) => ({
      ...prev,
      loading: false,
    }));
  }, []);

  return {
    loading: state.loading,
    text: state.text,
    show,
    hide,
  };
}
