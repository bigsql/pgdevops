from base import Singleton, PGC_API, BaseTest
import requests
import logging

logger = logging.getLogger(__name__)

class ServiceTests(BaseTest):
    def setUp(self):
        response = Singleton().response
        self.assertEqual(response['code'], 200)
        self.auth_token = response['authentication_token']

    def test_01_install(self):
        logger.info('installing ...')
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/install pg95', headers=headers)
        self.validate_response(response, "INSTALL")
        logger.info('INSTALL success')

    def disable_test_02_init(self):
        logger.info('init ...')
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/init pg95 --datadir //Users//naveen//PythonWorkspace//BigSQL//bigsql//data//pg95 --port 5432', headers=headers)
        self.validate_response(response, "INIT")
        logger.info('init success')

    def test_03_start(self):
        logger.info('starting ...')
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/start pg95', headers=headers)
        self.validate_response(response, "START")
        logger.info('Start success')

    def test_04_dbtune(self):
        logger.info('dbtune ...')
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/dbtune pg95 --email naveen.koppula@openscg.com', headers=headers)
        self.validate_response(response, "DBTUNE")
        logger.info('dbtune success')

    def test_05_stop(self):
        logger.info('stoping ...')
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/stop pg95', headers=headers)
        self.validate_response(response, "STOP")
        logger.info('Stop success')

    def disable_test_06_remove(self):
        logger.info('removing ...')
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/remove pg95', headers=headers)
        self.validate_response(response, "REMOVE")
        logger.info('Removing success')


