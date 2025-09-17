# Custom Local Startpage

## This is my Flask-hosted local startpage for my Arch Linux device that I use for Floorp (Firefox fork). Always a continuous WIP.
https://github.com/user-attachments/assets/b563a6f9-9a55-40e0-a35c-427fe364cc82

## Notes:
### Weather widget:
- The weather widget is maintained w/ the OpenWeatherMaps Free API, getting an API key & figuring out your location formatting for the widget/appropriate icons is explained when creating an account and generating a new API key: https://openweathermap.org/api
- This is all in `script.js`, your location can then be manually typed in `index.html` (does not impact API call).

### Scoreboard widgets:
- I found API endpoints for the NBA scoreboard widget through `stats.nba.com`. As you can see I currently have the Houston Rockets for my team to follow. All you need to do is find your team's ID and replace the ID I have for the Rockets in `app.py`.
- I found API endpoints for the Premier League scoreboard widget through `site.api.espn.com`. As with the Rockets scoreboard widget, you need to find your team ID and replace the ID I have for Arsenal in `app.py`
- The scoreboard widget can be easily removed/replaced with a widget of your choice if you decide to think of something else. Especially if you follow a soccer/football team outside of the Premier League, it is easy to follow the `app.py` structure and using espn's API endpoint to switch to a Bundesliga, La Liga, Serie A, etc. scoreboard widget of your choosing.

### Search engine functionality:
- I use Google as my search engine, so as a result of being able to implement an autofill/suggestion feature through Google I used their free Custom Search Engine API service (allows for ~300 calls a day) to get this to work.
- You will need to generate a Search Engine API key and also generate a 'CX-ID' key to have the one I have set to work properly: https://programmablesearchengine.google.com/about/
- You can try to use your preferred search engine (Bing, DuckDuckGo, etc.) and see if they have their own usable API endpoint. It will probably be easy to replace my current Google search engine setup whilst retaining the style/look of the search feature. This is all in `script.js`

### Creating systemd service + setting up virtual environment:
- Create & write this in `/etc/systemd/system/startpage.service`:

```
[Unit]
Description=Startpage Flask App
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/user/path/to/startpage/directory
ExecStart=/home/user/path/to/startpage/directory/venv/bin/python /home/user/path/to/startpage/directory/app.py
Restart=on-failure
Environment=FLASK_ENV=production

[Install]
WantedBy=default.target
```
- If you have Python properly working, then it is not required to create a virutal environment, and you simple can just run `python /home/user/path/to/startpage/directory/app.py`. Ensure you have all Python required packages (refer to `app.py`) to ensure the Flask service starts and runs correctly. Else, you will need to create a virtual environment and activate the environment to enable the installation of required packages prior to running the service or even testing the Flask app.
- Required Python packages: `flask`, `requests`, `flask-cors`; the rest are built into the latest version of Python
- You can check the status of your service in real-time by running: `sudo journalctl -u startpage.service -f`

### Site keys/sections
- These can be modified to your liking, but I do not have the icons readily available to switch and modify w/ `style.css` & `index.html`. It will probably be easy to look around the internet for the right icons, but I suggest making sure they're svgs for the sake of convenience/making the site look 'sleek' & 'modern'.

### Other customization, features, etc.
- This startpage was optimized and made to my preference, but I feel that it is pretty easy to play around with and can be used as a template to build your own startpage with. This has been a WIP for months and something I always try to improve, so don't feel afraid to be ambitious and make the tweaks you want-- animations, colors, font(s), and more!
- You can also start from scratch and use the three key files, `index.html`, `script.js`, and `style.css`, as a starting point. The startpage does not have to be ran with a Flask service, but is useful for the scoreboard widgets/having a clean url instead of locally opening the `index.html` file path.
- I won't be making any pushes/changes, this is just a template. But if you have any issues/concerns, feel free to make a post and I can try to help to the best of my knowledge.
### Getting URL & setting up new tab/window
- Once up and running, the page is locally ran through your localhost: `http://127.0.0.1:8080/`
- Since I am using Floorp (Firefox fork), I use the [New Tab Override extension](https://addons.mozilla.org/en-US/firefox/addon/new-tab-override/) so that every new tab goes to the local startpage. New tab settings can be modified in your settings page. I'm sure if you use a non-Firefox browser, the setup is very similiar and can be found online if needed.
