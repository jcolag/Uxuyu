import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { View } from 'proton-native';
import PanelFollow from './panelfollow';
import PanelMention from './panelmention';

export default class Sidebar extends Component {
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
        <PanelFollow
          config={this.props.config}
          following={this.props.following}
          owner={this.props.nick}
          switchUser={this.props.boundSwitchUser}
        />
        <PanelMention config={this.props.config}></PanelMention>
      </View>
    );
  }
}
Sidebar.propTypes = {
  boundSwitchUser: PropTypes.func,
  config: PropTypes.shape({
    fontSize: PropTypes.number,
    foregroundColor: PropTypes.string,
  }),
  following: PropTypes.object,
  nick: PropTypes.string,
  owner: PropTypes.string,
  switchUser: PropTypes.func,
};
