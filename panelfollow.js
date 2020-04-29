import React, {
  Component,
} from "react";
import {
  Text,
  View,
} from "proton-native";

export default class PanelFollow extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    const following = [];
    let key = 0;

    Object.keys(this.props.following).forEach(f => {
      following.push(
        <Text
          key={ ++key }
          style={{
            color: this.props.config.foregroundColor,
            fontSize: `${this.props.config.fontSize}pt`,
            fontWeight: 'bold',
            textAlign: 'left',
          }}
        >
          { f }
        </Text>
      );
    });
    return (
      <View style={{
        alignItems: 'flex-start',
        flex: 1,
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'flex-start',
        maxWidth: '250px',
        width: '250px',
      }}>
        <Text
          style={{
            color: this.props.config.foregroundColor,
            fontSize: `${this.props.config.fontSize * 1.25}pt`,
            fontWeight: 'bold',
            textAlign: 'left',
          }}
        >
          Following
        </Text>
        <View style={{
          alignItems: 'flex-start',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'flex-start',
          width: '100%',
        }}>
          { following }
        </View>
      </View>
    );
  }
}
