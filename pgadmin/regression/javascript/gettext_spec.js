//////////////////////////////////////////////////////////////////////////
//
// pgAdmin 4 - PostgreSQL Tools
//
// Copyright (C) 2013 - 2018, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////////////////

import gettext from 'sources/gettext';
import translations from 'translations';

describe('translate', function () {
  describe('when there is no translation', function () {
    it('returns the original string', function () {
      expect(gettext('something to be translated')).toEqual('something to be translated');
    });

    describe('when there are substitutions', function () {
      it('interpolates a substitution', function () {
        expect(gettext('translate text for %(person)s', {'person': 'Sarah'})).toEqual('translate text for Sarah');
      });

      it('interpolates multiple substitutions', function () {
        expect(gettext('translate \'%(text)s\' for %(person)s',
          {
            'text': 'constitution',
            'person': 'Sarah',
          }
        )).toEqual('translate \'constitution\' for Sarah');
      });
    });

  });

  describe('when there is a translation', function () {
    beforeEach(function () {
      translations['something to be translated'] = 'etwas zum uebersetzen';
      translations['another translation for %(person)s'] = 'eine weitere Uebersetzung fuer %(person)s';
    });

    it('returns the translation', function () {
      expect(gettext('something to be translated')).toEqual('etwas zum uebersetzen');
    });

    describe('when there is a substitution', function () {
      it('interpolates the substitution', function () {
        expect(gettext('another translation for %(person)s', {'person': 'Sarah'}))
          .toEqual('eine weitere Uebersetzung fuer Sarah');
      });
    });
  });
});
