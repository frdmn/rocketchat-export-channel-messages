# rocketchat-export-channel-messages

![](https://up.frd.mn/WTPKyFpRUM.png)

Simple Node CLI tool to export all messages of a given [Rocket.Chat](https://rocket.chat/) channel or private group.

## Installation

1. Make sure you've installed all requirements
2. Clone this repository:

    ```shell
    git clone https://github.com/frdmn/rocketchat-export-channel-messages
    ```

3. Copy and adjust configuration file from sample:

    ```shell
    cp config.sample.json config.json
    vi config.json
    ```

Make sure it contains proper user (with administration access) credentials

3. Install the project dependencies:

    ```shell
    npm install
    ```

## Usage

Here's a short explanation how to use `rocketchat-export-channel-messages`:

To export as CSV (default), run:

```shell
node index.js --room <roomName>
```

If you rather have a JSON export, pass the `--json` argument:

```shell
node index.js --room <roomName> --json
```

## Contributing

1. Fork it
2. Create your feature branch:

    ```shell
    git checkout -b feature/my-new-feature
    ```

3. Commit your changes:

    ```shell
    git commit -am 'Add some feature'
    ```

4. Push to the branch:

    ```shell
    git push origin feature/my-new-feature
    ```

5. Submit a pull request

## Requirements / Dependencies

* NodeJS

## Version

1.0.0

## License

[MIT](LICENSE)
