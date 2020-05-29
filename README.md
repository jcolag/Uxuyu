# Uxuyu
An experimental desktop client for twtxt

[twtxt](https://twtxt.readthedocs.io/en/latest/) is a sort of DIY social network that's nice in the sense that it's lightweight and fairly easy to manage---if you can put updates into a publicly-accessible file and read files other people post, you have everything you need---but as I mentioned in [my blog post](https://john.colagioia.net/blog/media/2020/03/21/twtxt.html), has serious discoverability problems.

Basically, the only way to find people you might want to talk to or to find people who are trying to talk to you is to regularly read *every* feed, just in case.  There are a couple of registries floating around, but not all of them do any analysis and not every twtxt user enters information into every registry.  That's nod ideal, but is obviously in the spirit of a bottom-up network.

The easiest solution that comes to mind is to handle the registry and analysis work on the client side, with an application to regularly download all known feeds, "harvest" the information, show the user what they follow, but also note when there's something else that the user should see.

This is a prototype for that idea, using [Proton Native](https://proton-native.js.org/#/) for the user interface alongside Node.js's [worker threads](https://nodejs.org/api/worker_threads.html) to avoid blocking the interface where possible.

## Contributions

I'll take (almost) all the help I can get!

I do, however, ask that you squeeze out all the ESLint and Prettier warnings before submitting a patch, only disabling the warnings in extreme cases.  Good examples would include tolerating variables that will definitely be used in the near future or cases where the two styles conflict.
