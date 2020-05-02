import React, {
  Component,
} from "react";
import {
  Button,
  TextInput,
  View,
} from "proton-native";

export default class Entry extends Component {
  constructor(props) {
    super(props);
    this.state = {
      defaultPostText: '',
    };
    this.postText = '';
    this.boundPostTweet = this.postTweet.bind(this);
  }

  tweetUpdated(text) {
    this.postText = text;
  }

  postTweet() {
    console.log(this.postText);
    this.setState({
      defaultPostText: this.postText,
    });
    this.postText = '';
    this.setState({
      defaultPostText: '',
    });
  }

  render() {
    return (
      <View style={{
        alignItems: 'flex-start',
        flex: 1,
        flexDirection: 'row',
        height: '40px',
        justifyContent: 'flex-start',
        maxHeight: '40px',
        width: '100%',
      }}>
        <TextInput
          onChangeText={text => this.tweetUpdated(text)}
          style={{
            backgroundColor: this.props.config.backgroundColor,
            border: '1px solid ' + this.props.config.foregroundColor,
            color: this.props.config.foregroundColor,
            fontSize: `${this.props.config.fontSize}pt`,
            height: '40px',
            width: '89%',
          }}
          value={this.state.defaultPostText}
        />
        <Button
          onPress={this.boundPostTweet}
          style={{
            backgroundColor: this.props.config.backgroundColor,
            border: '1px solid ' + this.props.config.foregroundColor,
            borderRadius: `${this.props.config.fontSize / 2}px`,
            fontWeight: 'bold',
            color: this.props.config.foregroundColor,
            fontSize: `${this.props.config.fontSize}pt`,
            height: '40px',
            marginLeft: '0.5%',
            width: '10%',
          }}
          title='Post'
        />
      </View>
    );
  }
}
