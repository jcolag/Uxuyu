import React, { Component } from "react";

import { Window, App } from "proton-native";

export default class Example extends Component {
  render() {
    return (
      <App>
        <Window
          style={{
            width: '75%',
            height: '75%',
            backgroundColor: "black",
          }}
        >
        </Window>
      </App>
    );
  }
}
