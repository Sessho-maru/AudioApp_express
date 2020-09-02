const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
app.use(cors());

const port = 5000;
const OFFSET_INDEX_CONTAIN_YTINITIALDATA = 3;
let ytInfos = [];

app.get('/api/url', (req, res) => {
    console.log(`serchTerm: ${req.query.search}`);
    ytInfos = [];

    axios.get(encodeURI(req.query.search))
        .then( (res) => {

            let chunk = [];
            let $ = cheerio.load(res.data);
            $('script').each( (i, element) => {
                chunk.push($(element));
            });

            let length = chunk.length;
            const rawString = $(chunk[length - OFFSET_INDEX_CONTAIN_YTINITIALDATA]).contents()[0].data;

            let splited = rawString.split("window[\"ytInitialData\"] = ");
            splited = splited[1].split(";\n");

            let youTubeJson = splited[0];
            youtubeJson = JSON.parse(youTubeJson)['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'];
            youtubeJson = youtubeJson.filter( (each) => each['videoRenderer'] !== undefined );

            youtubeJson.map( (each, i) => {

                let obj = {
                    videoId: "",
                    thumbnailUrl: "",
                    title: "",
                    viewCount: "",
                    duration: ""
                };

                obj.videoId = each['videoRenderer'].videoId;
                obj.thumbnailUrl = each['videoRenderer']['thumbnail']['thumbnails'][0].url;
                obj.title = each['videoRenderer']['title']['runs'][0].text;

                if (each['videoRenderer']['badges'] !== undefined)
                {
                    if (each['videoRenderer']['badges'][0]['metadataBadgeRenderer'].style === "BADGE_STYLE_TYPE_LIVE_NOW")
                    {
                        obj.duration = "LIVE NOW";
                        obj.viewCount = `${each['videoRenderer']['viewCountText']['runs'][0].text}${each['videoRenderer']['viewCountText']['runs'][1].text}`;
                    }
                    else
                    {
                        obj.duration = each['videoRenderer']['lengthText']['simpleText'];
                        obj.viewCount = each['videoRenderer']['viewCountText']['simpleText'];
                    }
                }
                else
                {
                    if (each['videoRenderer']['lengthText'] !== undefined)
                    {
                        obj.duration = each['videoRenderer']['lengthText']['simpleText'];
                        obj.viewCount = each['videoRenderer']['viewCountText']['simpleText'];
                    }
                    else
                    {
                        obj.duration = "LIVE NOW";
                        obj.viewCount = `${each['videoRenderer']['viewCountText']['runs'][0].text}${each['videoRenderer']['viewCountText']['runs'][1].text}`;
                    }
                }
                ytInfos.push(obj);
            });
        })
        .catch( (err) => {
            console.log(err);
        });

    res.status(200).send({msg: 'processed'});
});

app.get('/api/get', (req, res) => {
    console.log(ytInfos);
    res.status(200).send({msg: 'finished', result: ytInfos});
});

app.listen(port, () => {
    console.log(`----------------CORS-enabled web server listening on port ${port}----------------`)
});