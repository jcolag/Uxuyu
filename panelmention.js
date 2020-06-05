import PropTypes from 'prop-types';
import { Button, Text, View } from 'proton-native';
import React from 'react';

const moment = require('moment');

export default class PanelMention extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    let key = 0;
    const btnStyle = {
      border: `1px solid ${this.props.config.foregroundColor}`,
      borderRadius: `${this.props.config.fontSize / 2}px`,
      color: this.props.config.foregroundColor,
      fontSize: `${this.props.config.fontSize}pt`,
      fontWeight: 'bold',
      textAlign: 'center',
      width: '98%',
    };
    const mentionList = this.props.mentions.map((m) => (
      <Button
        key={++key}
        style={btnStyle}
        title={`${m.handle}, ${moment(m.date).fromNow()}`}
      />
    ));

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
          Mentions
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
          {mentionList}
        </View>
      </View>
    );
  }
}
PanelMention.propTypes = {
  config: PropTypes.shape({
    fontSize: PropTypes.number,
    foregroundColor: PropTypes.string,
  }),
  mentions: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.date,
      following: PropTypes.bool,
      handle: PropTypes.string,
      message: PropTypes.string,
    })
  ),
};
