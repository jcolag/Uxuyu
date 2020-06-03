import PropTypes from 'prop-types';
import { Text, View } from 'proton-native';
import React from 'react';

export default class PanelMention extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
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
          <Text
            style={{
              color: this.props.config.foregroundColor,
              fontSize: `${this.props.config.fontSize}pt`,
              fontWeight: 'bold',
              textAlign: 'left',
            }}
          >
            Test
          </Text>
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
  following: PropTypes.object,
  owner: PropTypes.string,
  switchUser: PropTypes.func,
};
