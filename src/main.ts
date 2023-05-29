import './assets/css/default.css'
import Loader from './content'
import Router from './router'
import App from './app'
import routes from './routes'

const loader: Loader = new Loader()
const router: Router = new Router(loader, routes)

export default new App(router, loader)
