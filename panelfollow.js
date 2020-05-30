import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Button, Text, View } from 'proton-native';

export default class PanelFollow extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.boundChangeUser = this.changeUser.bind(this);
  }

  changeUser(u) {
    this.props.switchUser(u);
  }

  render() {
    const following = [];
    const btnStyle = {
      border: `1px solid ${this.props.config.foregroundColor}`,
      borderRadius: `${this.props.config.fontSize / 2}px`,
      color: this.props.config.foregroundColor,
      fontSize: `${this.props.config.fontSize}pt`,
      fontWeight: 'bold',
      textAlign: 'center',
      width: '98%',
    };
    let key = 0;

    Object.keys(this.props.following).forEach((f) => {
      following.push(
        <Button
          key={++key}
          onPress={() => this.boundChangeUser(f)}
          style={btnStyle}
          title={f}
        />
      );
    });
    return (
      <View
        style={{
          alignItems: 'flex-start',
          flex: 1,
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'flex-start',
          maxWidth: '250px',
          width: '250px',
        }}
      >
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
        <View
          style={{
            alignItems: 'flex-start',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          <Button
            key={++key}
            onPress={() => this.boundChangeUser(this.props.owner)}
            style={btnStyle}
            title={`${this.props.owner} (you)`}
          />
          {following}
          <Button
            key={++key}
            onPress={() => this.boundChangeUser(null)}
            style={btnStyle}
            title=' 👉 All Users 👈 '
          />
        </View>
      </View>
    );
  }
}
PanelFollow.propTypes = {
  config: PropTypes.shape({
    fontSize: PropTypes.number,
    foregroundColor: PropTypes.string,
  }),
  following: PropTypes.object,
  owner: PropTypes.string,
  switchUser: PropTypes.func,
};
