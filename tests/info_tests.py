from base import Singleton, PGC_API, BaseTest
import requests
import logging

logger = logging.getLogger(__name__)

class InfoTests(BaseTest):
    def setUp(self):
        response = Singleton().response
        self.assertEqual(response['code'], 200)
        self.auth_token = response['authentication_token']

    def test_list(self):
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/list', headers=headers)
        self.validate_response(response, "LIST")
        logger.info('List success')

    def test_info(self):
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/info', headers=headers)
        self.validate_response(response, "INFO")
        logger.info('Info success')

    def test_status(self):
        headers = {
            "authentication_token": self.auth_token
        }
        response = requests.get(PGC_API + 'api/pgc/status', headers=headers)
        self.validate_response(response, "STATUS")
        logger.info('Status success')