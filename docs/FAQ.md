# FAQ

## How do I give FloorMap my own floor plans?

Upload the plan images as assets of a Stroom document, and point FloorMap's _FloorMap Config JSON_
setting at them.

Stroom serves a document's assets at `/assets/<document UUID>/<asset path>`, and only to users who
may view that document. The plans then get the same access controls as any other document.

1. Create a document to hold the plans, e.g. a Visualisation called _Floor Plans_.
   Keep the plans out of the FloorMap visualisation that comes with this pack, so that importing a
   newer pack doesn't overwrite them.
1. On its _Assets_ tab, upload the images, e.g. `building1/floor0.png`.
1. Give the users who need the plans _View_ permission on it.
1. In the dashboard's FloorMap settings, refer to each image by its address, e.g.

   ```json
   {
       "Head Office": {
           "Building 1": {
               "Ground": {
                   "image": "/assets/0b5c1f2e-3a4d-4e6f-8a9b-1c2d3e4f5a6b/building1/floor0.png",
                   "width": 120,
                   "height": 80,
                   "isOriginTopLeft": false
               }
           }
       }
   }
   ```

`width` and `height` are in the same units as the X and Y positions in the data. Positions are
counted from the plan's bottom left unless `isOriginTopLeft` is `true`.

A plan can also be given as a `data:` URL. Images on other web sites won't load, because Stroom
only lets a visualisation load images from Stroom itself.
