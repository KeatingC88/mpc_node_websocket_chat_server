const os = require('os')

const check_ethernet_port = () => {
    const interfaces = os.networkInterfaces()
    const ethernetInterfaces = []

    Object.keys(interfaces).forEach((iface) => {
        interfaces[iface].forEach((config) => {
            if (!config.internal && config.family === 'IPv4') {
                ethernetInterfaces.push({ name: iface, address: config.address })
            }
        })
    })

    return ethernetInterfaces.length > 0
        ? console.log('✅ Ethernet port detected:', ethernetInterfaces)
        : console.log('❌ No Ethernet port detected while this server requires it.')
}

check_ethernet_port()


console.log('Press any key to exit...')

process.stdin.setRawMode(true)

process.stdin.resume()
process.stdin.on('data', () => {

    console.log('\nExiting...')
    process.exit()

})