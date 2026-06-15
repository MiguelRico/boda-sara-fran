import { Component } from "react";

import { uiContent } from "../../constants/uiContent";
import ErrorScreen from "./ErrorScreen";

export default class AppErrorBoundary extends Component {
  state = {
    error: null,
  };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <ErrorScreen
          actionText={uiContent.error.retryAction}
          message={uiContent.error.globalMessage}
          onAction={this.handleReset}
          showHomeAction={false}
          title={uiContent.error.globalTitle}
        />
      );
    }

    return this.props.children;
  }
}
