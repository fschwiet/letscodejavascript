
//var rss = require("rss");


/*
https://npmjs.org/package/feedfinder -> seems to have best results, need to resolve ambiguity
  possible strategy:  pick the shortest url, not counting an whatever url prefix matches the incoming url
https://npmjs.org/package/detectfeed ->  seems to miss some
https://npmjs.org/package/discovery  -> hasn't been updated in 2 years, seems to merge results of previous calls, yuk.
https://npmjs.org/package/parsse  -> requires python
*/



/*

var discover = require("discovery");

rss = {
    detectUrl : function(htmlUrl, callback) {
        discover().find(htmlUrl).do(function(feeds) {
            console.log("feeds", feeds);
            var result;
            for(var key in feeds) {
                if (feeds.hasOwnProperty(key)) {
                    result = key;
                }
            }
            callback(null, { rssUrl: result});
        });
    }
};

*/

var detectFeed = require("detectfeed").detectFeedUrl;

rss = {
    detectUrl: function(htmlUrl, callback) {
        detectFeed(htmlUrl, function(err, result) {
            if (err !== null) {
                callback(err);
            } else {
                callback(null, {
                    rssUrl: result.feed
                });
            }
        });
    }
};

/*

var request = require('request');
var endpoint = require('endpoint');
var feedfinder = require('feedfinder');

rss = {
    detectUrl: function(htmlUrl, callback) {
        request(htmlUrl)
          .pipe(feedfinder(htmlUrl))
          .pipe(endpoint({objectMode: true}, function (err, links) {

            if (err !== null) {
                callback(err, null);
            } else {
                var results = [];
                console.log("links", links);
                links.forEach(function(link) {
                    if (link.type == "rss" || link.type == "atom") {
                        results.push(link.href);
                    }
                });

                results = results.sort(function(a,b) { return a.length - b.length;})

                if (results.length > 0) {
                    callback(null, { rssUrl: results[0]});
                } else {
                    callback(new Error("not found"));
                }
            }
          }));
    }
};
*/


function testRssLookup(htmlUrl, rssUrl) {

    exports["should be able to detect rss url from " + htmlUrl] = function(test) {

        console.log("looking up " + htmlUrl);

        rss.detectUrl(htmlUrl, function(err, result) {
            test.ifError(err);

            if (err === null) {
                test.equal(result.rssUrl, rssUrl);
            }
            test.done();
        });
    }
}

/*

exports["should be able to report failure"] = function(test) {


    rss.detectUrl("http://notyourserver.boo/lol", function(err, result) {

        test.ok(err !== null, "expected an error");
        test.done();
    });
};

*/

/*
var feeds = require("./feeds");
var util = require("util");

exports["export feeds"] = function(test) {

    feeds.loadSubscriptionsFromGoogleXml("C:/Users/user/Downloads/google-reader-subscriptions.xml")
    .then(function(results) {
        test.done();
        results.forEach(function(row) {
            console.log(util.format("testRssLookup(%s, %s);", JSON.stringify(row.htmlUrl), JSON.stringify(row.rssUrl)));
        });
    });
};
*/


testRssLookup("http://www.codinghorror.com/blog/", "http://feeds.feedburner.com/codinghorror/");
testRssLookup("http://www.curiousoffice.com", "http://www.curiousoffice.com/feed/");
testRssLookup("http://aboutcode.net/", "http://feeds.feedburner.com/aboutcode");
testRssLookup("http://cutroni.com/blog", "http://cutroni.com/blog/feed/");
testRssLookup("http://mohamedradwan.wordpress.com", "http://mohamedradwan.wordpress.com/feed/");
testRssLookup("http://weblogs.asp.net/sylvainduford/default.aspx", "http://weblogs.asp.net/sylvainduford/rss.aspx");
testRssLookup("http://ayende.com/blog/", "http://ayende.com/blog/rss");
testRssLookup("http://benhuh.com", "http://benhuh.com/feed/");
testRssLookup("http://www.blogger.com/profile/10687137192671084020", "http://www.blogger.com/feeds/10687137192671084020/blogs");
testRssLookup("http://blog.cheezburger.com", "http://blog.cheezburger.com/feed/");
testRssLookup("http://mikehadlow.blogspot.com/", "http://mikehadlow.blogspot.com/feeds/posts/default");
testRssLookup("http://www.code972.com/blog", "http://www.code972.com/blog/feed/");
testRssLookup("http://www.mattfreeman.co.uk", "http://www.mattfreeman.co.uk/atom.xml");
testRssLookup("http://www.codingrhythm.com/", "http://www.codingrhythm.com/feeds/posts/default");
testRssLookup("http://pivotallabs.com/users/dwfrank/blog", "http://pivotallabs.com/users/dwfrank/blog.rss");
testRssLookup("http://compositecode.com", "http://compositecode.com/feed/");
testRssLookup("http://continuousdelivery.com", "http://continuousdelivery.com/feed/");
testRssLookup("http://seattle.craigslist.org/search/jjj?query=.net (bdd | tdd | nunit| ravendb | nhibernate)&amp;srchType=A", "http://seattle.craigslist.org/search/jjj?query=.net+(bdd+%7C+tdd+%7C+nunit%7C+ravendb+%7C+nhibernate)&srchType=A&format=rss");
testRssLookup("http://danappleman.com", "http://www.danappleman.com/?feed=rss2");
testRssLookup("http://dbvt.com/blog/", "http://feeds.feedburner.com/daveburke");
testRssLookup("http://weblogs.asp.net/leftslipper/default.aspx", "http://weblogs.asp.net/LeftSlipper/rss.aspx");
testRssLookup("http://www.ekeepo.com", "http://www.ekeepo.com/feed/");
testRssLookup("http://eli.eliandlyndi.com", "http://eli.eliandlyndi.com/feed/");
testRssLookup("http://blog.endquote.com/", "http://blog.endquote.com/rss");
testRssLookup("http://analytics.blogspot.com/", "http://analytics.blogspot.com/feeds/posts/default");
testRssLookup("http://googletesting.blogspot.com/", "http://googletesting.blogspot.com/feeds/posts/default");
testRssLookup("http://blog.hibernatingrhinos.com/", "http://blog.hibernatingrhinos.com/rss");
testRssLookup("http://highscalability.com/blog/", "http://highscalability.com/rss.xml");
testRssLookup("http://hugoware.net", "http://feeds2.feedburner.com/hugoware");
testRssLookup("http://iamnotmyself.com", "http://iamnotmyself.com/feed/");
testRssLookup("http://blogs.msdn.com/b/ie/", "http://blogs.msdn.com/rss.aspx");
testRssLookup("http://blogs.msdn.com/b/tess/", "http://blogs.msdn.com/b/tess/rss.aspx");
testRssLookup("http://www.juancole.com", "http://www.juancole.com/feed");
testRssLookup("http://jameskovacs.com", "http://jameskovacs.com/feed/");
testRssLookup("http://www.joelonsoftware.com", "http://www.joelonsoftware.com/rss.xml");
testRssLookup("http://ejohn.org", "http://feeds.feedburner.com/JohnResig");
testRssLookup("http://josheinstein.com/blog", "http://josheinstein.com/blog/index.php/feed/");
testRssLookup("http://john-sheehan.com/rss", "http://feeds.feedburner.com/JustSayinMoreWords");
testRssLookup("http://openmymind.net/", "http://feeds.feedburner.com/KarlSeguinsBlog");
testRssLookup("http://kellabyte.com", "http://kellabyte.com/feed/");
testRssLookup("http://kellabyte.wordpress.com", "http://kellabyte.wordpress.com/feed/");
testRssLookup("http://kozmic.net", "http://feeds.feedburner.com/kozmic");
testRssLookup("http://blog.learningbyshipping.com", "http://blog.learningbyshipping.com/feed/");
testRssLookup("http://www.liesdamnedlies.com/", "http://www.liesdamnedlies.com/atom.xml");
testRssLookup("http://www.marcusirven.com/", "http://feeds2.feedburner.com/mirven");
testRssLookup("http://blogs.msdn.com/b/marleyg/", "http://blogs.msdn.com/marleyg/rss.aspx");
testRssLookup("http://blogs.taiga.nl/martijn", "http://blogs.taiga.nl/martijn/feed/");
testRssLookup("http://martinfowler.com", "http://www.martinfowler.com/bliki/bliki.atom");
testRssLookup("http://blog.mattgoyer.com/categories/mediaCenter/", "http://blog.mattgoyer.com/categories/mediaCenter/rss.xml");
testRssLookup("http://minimsft.blogspot.com/", "http://minimsft.blogspot.com/atom.xml");
testRssLookup("http://blogs.technet.com/monitoringmicrosoft/default.aspx", "http://blogs.technet.com/monitoringmicrosoft/rss.xml");
testRssLookup("http://mostlylucid.net/Default.aspx", "http://feeds.feedburner.com/mostlylucid/XRDO");
testRssLookup("http://blogs.msdn.com/b/gblock/", "http://feeds.feedburner.com/MyTechnobabble");
testRssLookup("http://nhforge.org/blogs/nhibernate/default.aspx", "http://feedproxy.google.com/NHibernateBlog");
testRssLookup("http://www.nikhilk.net", "http://nikhilk.net/Rss.ashx");
testRssLookup("http://blog.objectmentor.com/articles/category/uncle-bobs-blatherings", "http://blog.objectmentor.com/xml/atom/category/uncle-bobs-blatherings/feed.xml");
testRssLookup("http://mdenomy.wordpress.com", "http://mdenomy.wordpress.com/feed/");
testRssLookup("http://oranlooney.com/", "http://oranlooney.com/feeds/blog/");
testRssLookup("http://www.google.com/reader/view/feed%2Fhttp%3A%2F%2Ffeeds.feedburner.com%2FOrenEini", "http://feeds.feedburner.com/OrenEini");
testRssLookup("http://webanalytics.ox2.eu", "http://webanalytics.ox2.eu/feed/");
testRssLookup("http://www.paulgraham.com/", "http://www.aaronsw.com/2002/feeds/pgessays.rss");
testRssLookup("http://krugman.blogs.nytimes.com/", "http://krugman.blogs.nytimes.com/feed/");
testRssLookup("http://blog.dotnetwiki.org/", "http://feeds.feedburner.com/PelisFarm");
testRssLookup("http://thephoenixjones.blogspot.com/", "http://thephoenixjones.blogspot.com/feeds/posts/default");
testRssLookup("http://dennismulder.net/CS/blogs/dennism/default.aspx", "http://feeds.feedburner.com/DennisMulder");
testRssLookup("http://resharper.blogspot.com/", "http://resharper.blogspot.com/feeds/posts/default");
testRssLookup("http://www.west-wind.com/weblog/", "http://feedproxy.google.com/rickstrahl");
testRssLookup("http://codeofrob.com", "http://feeds.feedburner.com/RobAshton?format=xml");
testRssLookup("http://blog.robertgreyling.com/", "http://blog.robertgreyling.com/feeds/posts/default");
testRssLookup("http://wiki.rubyonrails.org/rails", "http://wiki.rubyonrails.com/rails/feed.rss");
testRssLookup("http://www.samsaffron.com/posts.rss", "http://www.samsaffron.com/posts.rss");
testRssLookup("http://www.hanselman.com/blog/", "http://feeds.feedburner.com/ScottHanselman");
testRssLookup("http://weblogs.asp.net/scottgu/default.aspx", "http://weblogs.asp.net/scottgu/Rss.aspx");
testRssLookup("http://seattlebubble.com/blog", "http://feeds.feedburner.com/SeattleBubble");
testRssLookup("http://codebetter.com/sebastienlambla", "http://codebetter.com/sebastienlambla/feed/rss/");
testRssLookup("http://blogs.msdn.com/b/somasegar/", "http://blogs.msdn.com/somasegar/rss.aspx");
testRssLookup("http://blog.stackoverflow.com", "http://blog.stackoverflow.com/");
testRssLookup("http://StephenWalther.com", "http://feeds.feedburner.com/StephenWalther");
testRssLookup("http://blog.stevensanderson.com", "http://blog.stevensanderson.com/feed/");
testRssLookup("http://www.ted.com/talks/list", "http://feeds.feedburner.com/tedtalks_video");
testRssLookup("http://testdrivenwebsites.com", "http://testdrivenwebsites.com/feed/");
testRssLookup("http://www.acquisio.com", "http://www.blogs.commerce360.com/feed/");
testRssLookup("http://seattlecondosandlofts.com", "http://feeds.feedburner.com/SeattleCondosLofts");
testRssLookup("http://ricks.foreignpolicy.com/blog/2187", "http://ricks.foreignpolicy.com/blog/2187/feed");
testRssLookup("http://www.richardsilverstein.com", "http://www.richardsilverstein.com/tikun_olam/feed/");
testRssLookup("http://lunaverse.wordpress.com", "http://lunaverse.wordpress.com/feed/");
testRssLookup("http://engineering.tumblr.com/", "http://engineering.tumblr.com/rss");
testRssLookup("http://blogs.zmag.org/ttt", "http://blog.zmag.org/ttt/index.rdf");
testRssLookup("http://www.urbnlivn.com", "http://www.urbnlivn.com/feed/");
testRssLookup("http://watinandmore.blogspot.com/", "http://watinandmore.blogspot.com/feeds/posts/default");
testRssLookup("http://blog.webanalyticsdemystified.com/weblog", "http://feeds.feedburner.com/ericpeterson");
testRssLookup("http://whereslou.com", "http://whereslou.com/feed");
testRssLookup("http://blogs.msdn.com/b/wndp/", "http://blogs.msdn.com/wndp/rss.aspx");
testRssLookup("http://xprogramming.com", "http://xprogramming.com/feed/");
testRssLookup("http://haacked.com/Default.aspx", "http://feeds.haacked.com/haacked/");
testRssLookup("http://www.cartwrightreed.com/", "http://www.cartwrightreed.com/atom.xml");
testRssLookup("http://codelikebozo.com", "http://codelikebozo.com/rss.xml");

