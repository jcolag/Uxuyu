# Uxuyu
An experimental desktop client for twtxt

[twtxt](https://twtxt.readthedocs.io/en/latest/) is a sort of DIY social network that's nice in the sense that it's lightweight and fairly easy to manage---if you can put updates into a publicly-accessible file and read files other people post, you have everything you need to publish---but as I mentioned in [my blog post](https://john.colagioia.net/blog/media/2020/03/21/twtxt.html), it has serious discoverability problems.

Basically, the only way to find people you might want to talk to or to find people who are trying to talk to you is to regularly read *every* feed, just in case.  There are a couple of registries floating around, but none of them (to my knowledge) do any analysis and not every twtxt user enters information into every (or any) registry.  That's not ideal, but is obviously in the spirit of a bottom-up network.

The easiest solution that comes to mind is to handle the registry and analysis work on the client side, with an application to regularly download all known feeds, "harvest" the information, show the user what they follow, but also note when there's something else that the user should see.

This is a prototype for that idea, using [Proton Native](https://proton-native.js.org/#/) for the user interface alongside Node.js's [worker threads](https://nodejs.org/api/worker_threads.html) to avoid blocking the interface where possible.

## Major Functions

You can probably figure most of this out on your own, but the overall outline of how this works, until I have time to write up full documentation, is as follows.

### Configuration

The core configuration information is taken from your existing twtxt configuration file.  Your followers, post-tweet script, and so forth are all pulled in for use, here.  If you use a different client, you may need to convert your configuration file to the form expected by the original twtxt client.  I haven't experimented with any of them.

You can override several of **Uxuyu**'s features to improve your experience.  The default configuration is the following.

```json
{
  "backgroundColor": "black", // This can be any color recognized in CSS
  "cachePosts": false,        // Store posts in the database for offline
                              // access, if set to true
  "fontFamily": null,         // Again, like CSS
  "fontSize": 18,             // This number is in pixels; other units at your
                              // own risk
  "foregroundColor": "white", // Again, like CSS
  "minInterval": 15,          // By default, build all cyclical tasks on this
                              // number of minutes
  "openApp": null,            // If your post-tweet script requires a specific
                              // interpreter, mention that here
  "scrapeRegistries": false,  // Turn on the experimental ability to download
                              // user information from registries
  "textWidth": 100,           // Point in a post to try to wrap to the next line
}
```

The word wrap assumes that you're using a proportional font, and in the absence of specific font metrics (Proton Native doesn't expose them, yet), is just a guess.

### Reading Messages

You have a main panel where posts are shown.  In the lower right of the window, the left/right buttons allow the user to page through the posts.

By default, the posts are only from users you follow, but the upper-left panel allows you to choose to see posts from a specific followed user, all followed users, or all known users on the network, the "firehose."

The lower-left panel also allows the user to see messages from users who @mention them.

The input field in the bottom also doubles as a search bar, if you click the Search button with the magnifying glass on it.  The search results will show in the main panel, with the same paging.

### Sending Messages

If, instead, you send the text, **Uxuyu** will append your message to your feed and invoke any post-tweet script that you might have set.

### Directives

Instead of sending a message, you can give **Uxuyu** a task to accomplish, one of the following.

|Directive|Parameter|Action Taken|
|---------|---------|------------|
|`/registry`| |Update information from known (hard-coded) registries now, rather than waiting for the next cycle.|
|`/peer`| |Download all known peer feeds now, rather than waiting for the next cycle.|
|`/follow`|One or more users' handles|Begin following the specified user(s), if you have seen the user before.|
|`/unfollow`|One or more users' handles|Stop following the specified user(s), assuming you currently follow them.|
|`/view`|One user's handle|Switch to a specific user's feed, whether or not you follow that feed.|

A *handle* is the easy thing you call a user, such as `@twtxt` for news about the twtxt project or `@we_are_twtxt` for one of the registries.  You can include the at-sign or ignore it.

Note that, if two feeds have the same handle, this may produce inconsistent results.

### Automatic Retrieval

In the background, **Uxuyu** will retrieve feeds from people you follow, any feeds mentioned in those feeds, and any feeds found in the common twtxt user registries.

## Contributions

I'll take (almost) all the help I can get!

I do, however, ask that you squeeze out all the ESLint and Prettier warnings before submitting a patch, only disabling the warnings in extreme cases.  Good examples would include tolerating variables that will definitely be used in the near future or cases where the two styles conflict.
