# lucos_search_component
Web Component for searching lucOS data

## Technologies used
* ES Modules
* Web Components

## Usage
Include the following in your javascript:
```
import 'lucos_search_component';
```

Include the following in your html:
```
<span is="lucos-search">
	<select>
		<option>A</option>
		<option>B</option>
		<option>C</option>
	</select>
</span>
```


## Manual Testing

Expects a `.env` file in the root directory with the following environment variables:
* KEY_LUCOS_ARACHNE - an API for lucos_arachne, as set by lucos_creds

(The `.env` file can be automatically generated using the command `scp -P 2202 "creds.l42.eu:${PWD##*/}/development/.env" .`, assuming the correct credentials are in place)

Run:
```
npm run example
```
This uses webpack to build the javascript and then opens a html page which includes the web component
